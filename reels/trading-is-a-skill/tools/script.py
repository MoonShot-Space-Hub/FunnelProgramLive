"""The reel's script, shared by tts.py (Kokoro voice) and align.py (recorded voice)."""

# (id, text shown in captions, pause after the line in seconds - used by tts.py only)
SCRIPT = [
    ("surgery", "You wouldn't watch one surgery video and start operating on somebody.", 0.35),
    ("plane", "You wouldn't read one article and try to fly a plane.", 0.40),
    ("youtube", "But people watch three YouTube videos,", 0.45),
    ("account", "and start operating their trading account.", 0.50),
    ("why", "Why?", 0.55),
    ("skill", "Trading is also a skill.", 0.30),
    ("requires", "And every real skill requires:", 0.30),
    ("education", "Education.", 0.25),
    ("practice", "Practice.", 0.25),
    ("rules", "Rules.", 0.50),
    ("overnight", "You don't need to learn everything overnight.", 0.25),
    ("shortcut", "But you do need to stop treating a professional skill like a shortcut.", 0.60),
    ("cta1", "If you want a structured place to begin,", 0.15),
    ("cta2", "watch my free one-hour ABCT With AI Masterclass.", 0.25),
    ("cta3", "Link is below.", 0.0),
]

# How long the end card holds after the last word (seconds).
END_HOLD = 2.4
