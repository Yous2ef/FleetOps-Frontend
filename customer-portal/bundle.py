import os

# الملفات أو الفولدرات اللي مش عايزينها تدخل في الملف
ignore_list = ['.git', 'node_modules', '__pycache__', '.vscode', 'bundle.py', 'full_project_context.txt']
# الامتدادات اللي تهمنا
valid_extensions = ['.html', '.css', '.js', '.json']

output_file = "full_project_context.txt"

with open(output_file, "w", encoding="utf-8") as f:
    for root, dirs, files in os.walk("."):
        # تجاهل الفولدرات المحظورة
        dirs[:] = [d for d in dirs if d not in ignore_list]
        
        for file in files:
            if any(file.endswith(ext) for ext in valid_extensions):
                file_path = os.path.join(root, file)
                f.write(f"\n{'='*50}\n")
                f.write(f"FILE: {file_path}\n")
                f.write(f"{'='*50}\n\n")
                try:
                    with open(file_path, "r", encoding="utf-8") as content:
                        f.write(content.read())
                except Exception as e:
                    f.write(f"Error reading file: {e}")
                f.write("\n")

print(f"Done! Your project is now in {output_file}")