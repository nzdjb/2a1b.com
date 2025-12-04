Recently, I found an [Eval Injection](https://cwe.mitre.org/data/definitions/95.html) vulnerability in Balatro, resulting in arbitrary code execution.

This affects version 1.0.1o-FULL and is unpatched at time of writing.

## The game

[Balatro](https://www.playbalatro.com/) is a poker-based rogue-like deck-builder game, created by [LocalThunk](https://localthunk.com/). 

## The bug

Eval Injection (or "Improper Neutralization of Directives in Dynamically Evaluated Code") is an issue where input is executed as code, without proper sanitisation or sandboxing. This is a type of code execution vulnerability, which can lead to all manner of security breaches.

In the case of Balatro, the bug can be triggered by loading a specially crafted save game file.

## Finding the bug

Balatro, like a variety of other games, has some achievements that are not necessarily hard but require a lot of luck and repetition to complete. Sometimes, I reach a certain point where messing with the game to make the achievements easier becomes more interesting than grinding them out. This often involves decoding and modifying save files. 

In the case of Balatro, I decoded the save file (it was compressed with raw deflate) and saw a Lua table. That's a little tricky to work with, but not impossible.

Then I noticed that the save file ... starts with "return". Is the save file a function? I decided to test this out.

I looked through the table and found a promising value named "dollars". I confirmed that modifying this with a static value would change the amount of money the save game had. Then I set the value to some arithmetic: 50+47.

After recompressing the file, putting it in the right place and starting the game, I saw that the arithmetic had been performed and the money was set to 97. This confirms that code in the save file is being run.

## Diving into the code

I decided to look deeper into what was going on. I started by inspecting the binary with [Detect-It-Easy](https://github.com/horsicq/Detect-It-Easy). This showed that the binary was comprised primarily of a Lua runtime and an archive. I opened the binary with [7z](https://www.7-zip.org/) and found it contained a bunch of Lua files. This was the unobfuscated source code for the game[^1].

I searched for `save.jkr`, the name of the save file, and found that a function called `G.FUNCS.can_continue` is responsible for loading saved games.

In particular, this section of the code:
```lua
      if not G.SAVED_GAME then 
        G.SAVED_GAME = get_compressed(G.SETTINGS.profile..'/'..'save.jkr')
        if G.SAVED_GAME ~= nil then G.SAVED_GAME = STR_UNPACK(G.SAVED_GAME) end
      end
```

This has `get_compressed` and `STR_UNPACK`, both from `engine/string_packer.lua`.
`get_compressed` is fairly mundane[^2], but `STR_UNPACK` is:
```lua
function STR_UNPACK(str)
  return assert(loadstring(str))()
end
```

From some other information, I saw that the game was built using the LÖVE framework, which uses Lua 5.1. 

* [loadstring](https://www.lua.org/manual/5.1/manual.html#pdf-loadstring) takes a string and turns it into a "chunk" (basically Lua code).
* [assert](https://www.lua.org/manual/5.1/manual.html#pdf-assert) throws an error if its argument is nil or false, otherwise returns the argument.
* `()` executes the chunk.

So this code reads save.jkr, decompresses it and executes it. That's a pretty straight-forward Eval Injection path.

## Developing an exploit

What can we do with this? All sorts of things! The game executes code in the global Lua context so an exploit has access to essentially the entire programming language, as well as the LÖVE framework.

The following is an example save file that will break out of the application and run commands in the OS.

```lua
return {
  ["EXAMPLE"] = {
    ["Linux"] = os.execute("gnome-calculator"),
    ["Macos"] = os.execute("open -a Calculator"),
    ["Windows"] = os.execute("calc.exe"),
  }
}
```

Putting this file in the profile folder and running the game results in a calculator process starting. Yay.

This could obviously be replaced with something far nastier, but spawning calculator serves as a proof-of-concept.

## How to fix this

### Using safe serialization formats
Don't! Load! Code!

This issue resulted from a mechanism used for loading code being used to load data. Using a format that doesn't represent executable code is a safer approach. JSON, protobuf and XML are popular choices. Even then, it's important to make sure that the deserializer does not have any "helpful" features that can result in code execution.

### Sandboxing
If you really must load code, ensure it's done in a manner that limits the functionality it has access to.

In Lua, this is actually really easy to do:
```lua
function STR_UNPACK(str)
  local func = assert(loadstring(str)) -- turn the string into a function
  local safe_func = setfenv(func, {}) -- set an empty environment on the function
  return safe_func()
end
```
This loads the string into a chunk, sets the environment (what functions the function has access to) to an empty set and then executes it.

## The result

I had a lot of trouble trying to get hold of someone to acknowledge the bug. The developer never responded and the publisher said they would investigate, but then went silent.

### Mitigations

Don't load save games from untrusted sources until there is a patch for this issue. ¯\\\_(ツ)\_/¯

### Timeline

* 2025-09-08: Emailed the developer about the issue.
* 2025-09-16: Sent follow up email to the developer.
* 2025-09-19: Sent message to the developer through their contact form.
* 2025-09-21: Disclosed bug in #bug-reports channel on the official Discord.
* 2025-09-28: Emailed the publisher, got an automated response.
* 2025-10-02: Received response from publisher saying they would log and investigate the issue.
* 2025-11-13: Emailed publisher for update and stating intention to publish. No response.
* 2025-12-05: Published this post.

[^1]: I found out later that the [recommended approach for shipping LÖVE games](https://love2d.org/wiki/Game_Distribution) is to concatenate the framework loader and a zip of the source together, so this is intentional.
[^2]: One interesting thing about `get_compressed` is that if checks the first 6 bytes of a save file for "return" and skips decompression if there's a match. This made exploit development easier.
