#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define SOURCE_DIR "./source/"
#define DEST_DIR "./destination/"

void move_file(const char *filename) {
    char source_path[256];
    char dest_path[256];

    // Construct the source and destination paths
    snprintf(source_path, sizeof(source_path), "%s%s", SOURCE_DIR, filename);
    snprintf(dest_path, sizeof(dest_path), "%s%s", DEST_DIR, filename);

    // Move the file using rename
    if (rename(source_path, dest_path) == 0) {
        printf("Successfully moved: %s\n", filename);
    } else {
        perror("Error moving file");
    }
}

int main() {
    // Example filenames to move
    const char *filenames[] = {
        "file1.txt",
        "file2.txt",
        "example.doc",
        "report.pdf"
    };
    size_t num_files = sizeof(filenames) / sizeof(filenames[0]);

    // Loop through the files and move them
    for (size_t i = 0; i < num_files; ++i) {
        // Add custom logic here to determine if the file should be moved
        if (strstr(filenames[i], "file") != NULL) { // Example: move files with "file" in the name
            move_file(filenames[i]);
        }
    }

    return 0;
}
