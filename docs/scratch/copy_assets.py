import os
import shutil

src_arch = r"C:\Users\hp\.gemini\antigravity-ide\brain\3f52bbb6-7488-4057-b79b-58698dbd1186\vocalis_architecture_diagram_1787775078365.jpg"
src_dash = r"C:\Users\hp\.gemini\antigravity-ide\brain\3f52bbb6-7488-4057-b79b-58698dbd1186\vocalis_committee_dashboard_1787775093836.jpg"

dest_dir = r"d:\Riyanshi\01_coding\projects\37 VoiceIntro AI"

dest_arch = os.path.join(dest_dir, "vocalis_architecture_diagram.jpg")
dest_dash = os.path.join(dest_dir, "vocalis_committee_dashboard.jpg")

shutil.copyfile(src_arch, dest_arch)
shutil.copyfile(src_dash, dest_dash)

print(f"Copied {dest_arch}")
print(f"Copied {dest_dash}")
