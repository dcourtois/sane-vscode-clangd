# Introduction

Tired of all this bullshit security stuff, notification, attention hogs that are suposedly meant to protect you from yourself?
Want a sane Clangd addon that you can use without constantly having to click on popups, and which can talk to CMake based projects?
Then this is the addon for you.

One of the "cool" thing that you can do is, if you're using the CMake Tools extension, that you can write something like this in your
settings.json file:

```json
    "clangd.options": [
        "--compile-commands-dir=${command:cmake.buildDirectory}"
    ]
```

and be done with it! You no longer have to update this fxxing setting anytime you switch CMake configuration, and then have to click on
1 or 2 dumb notifications that you might not even see because CMake is a piece of crap which takes forever to run on any decently sized
project, so you have the habit of checking your emails while waiting for the configure step to finish, and when you're back, the notifications
are long gone, and you forget to restart the server manually, and you end up with slightly screwed-up completion because you're no longer
using the correct compile commands file...

Hopefully this is all in the past now. Up to the bug in this extension, and in Clangd, that is.
