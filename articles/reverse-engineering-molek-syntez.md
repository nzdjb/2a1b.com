In this article, I describe the steps I took to reverse engineer the Solitaire portion of MOLEK-SYNTEZ to unlock an achievement more quickly. 

## What is reverse engineering?

Reverse engineering is the process of taking a product and observing its behaviour and deconstructing it to understand the how it works. This is often done with the aim of reproducing parts of it in another product or modifying the behaviour of the product in some way.

## The game

MOLEK-SYNTEZ (2019) is a puzzle game developed and published by Zachtronics. In it, you program a molecular synthesizer to transform various precursor molecules into the desired output molecules.

As with many Zachtronics games, there is also a Solitaire game included. 

## The achievement

Charlatan: Win 100 games of solitaire.

Winning the Solitaire is not especially hard, but takes a while. After winning around 20 something games, I got bored and decided to see if I could speed things up.

## Failed approaches

Typically, I'd use Cheat Engine or Saved Game Modification for this sort of thing. 

### Cheat Engine

[Cheat Engine](https://www.cheatengine.org/) allows you to repeatedly scan the memory of a process for particular values. By changing the value in game and rescanning, you can narrow down the list of memory addresses to identify the address that stores the value. Once this is done, you can then change the value at that address to affect the state of the game.

Unfortunately, after identifying the address for the number of solitaire wins, modifying it didn't impact the achievement and the number was reset to the real value after another win was added.

### Saved Game Modification

Another approach for modifying a game's state is to decode and modify the save files.

However, in this case, the number of solitaire wins didn't seem to be stored in any of the save files. I also checked the registry, but wasn't able to find it there either.

## Reverse engineering the game

The first step to finding out how the game works is to try to decompile it. For that, it helps to know what kind of executable we're working with.

Using the file command, we can find that MOLEK-SYNTEZ.exe is a .Net assembly. .Net languages are compiled to the [Common Intermediate Language](https://en.wikipedia.org/wiki/Common_Intermediate_Language), which can be decompiled fairly easily to readable C# code. My tool of choice for this is [dnSpy](https://github.com/dnSpyEx/dnSpy), which supports debugging as well as decompilation.

On opening the binary and decompiling it, I found that it was partially obfuscated. All the variables, most of the method calls and some of the class names had been replaced with indecipherable strings. Fortunately, there's a very good tool for deobfuscating .Net called [de4dot](https://github.com/kant2002/de4dot). With the help of this, I was able to return the code to a fairly readable state.

While de4dot can't recover obfuscated symbols, a lot of the classes in the binary hadn't had their names obfuscated. In particular, these looked promising: SolitaireAnimation, SolitaireItem, SolitaireScreen and SolitaireState.

I also noticed that the game used a library called Steamworks.NET, which is used for interacting with Steam for tasks including setting achievements. Looking at the Solitaire classes, I found that the library was used in SolitaireScreen, with a class called SteamUserStats. Static methods from this class were used several times in one part of the code, which looked like this:

```CS
if (this.method_0().method_0() || GClass74.smethod_14((GEnum122)3, Key.F11))
{
  GClass5.smethod_2().sound_20.smethod_1();
  GameLogic.gameLogic_0.gclass116_0.method_7(this.method_0().bool_0);
  if (!this.method_0().bool_0)
  {
    SteamUserStats.SetAchievement("NO_CHEAT");
    SteamUserStats.StoreStats();
  }
  if (GClass102.bool_3 && this.method_0().method_0() && SteamUserStats.GetStat("SOLITAIRE", out this.int_0))
  {
    this.int_0++;
    SteamUserStats.SetStat("SOLITAIRE", this.int_0);
    SteamUserStats.StoreStats();
    if (this.int_0 <= 1)
    {
      SteamUserStats.IndicateAchievementProgress("SOLITAIRE_1", (uint)this.int_0, 1U);
    }
    else if (this.int_0 <= 10)
    {
      SteamUserStats.IndicateAchievementProgress("SOLITAIRE_2", (uint)this.int_0, 10U);
    }
    else if (this.int_0 <= 100)
    {
      SteamUserStats.IndicateAchievementProgress("SOLITAIRE_3", (uint)this.int_0, 100U);
    }
  }
  this.method_0().genum116_0 = (GEnum116)2;
  this.method_0().float_1 = 0f;
}
```

In particular, these five lines stood out:

```C#
if (GClass102.bool_3 && this.method_0().method_0() && SteamUserStats.GetStat("SOLITAIRE", out this.int_0))
{
  this.int_0++;
  SteamUserStats.SetStat("SOLITAIRE", this.int_0);
  SteamUserStats.StoreStats();
```

This code is retrieving the value of the "SOLITAIRE" stat, incrementing it and storing it back. I set a breakpoint on the post-increment line and attached the debugger to my game process. After winning a game of Solitaire, the game froze and dnSpy showed me I was at the post-increment line.

From there, I opened the Locals tab in dnSpy and found `this.int_0`. Unfortunately, changing the value directly in the Locals tab gave an "Internal debugger error", but I was able to work around this by opening the address in a Memory tab and changing the hex value directly.

After that, I continued the process. My edited Win Count was displayed in the game and I was given the achievement. Hooray!

## Summary

Decompiling and debugging the game was quite a lot more work than fiddling values through Cheat Engine, but it provided quite a lot more control over the process, which was what was needed in this situation.
