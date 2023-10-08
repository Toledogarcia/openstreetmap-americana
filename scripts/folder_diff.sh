#!/bin/bash
# Compare two folders of images and produce an .md file of differences

# Check if the right number of arguments are passed
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <folder1> <folder2>"
    exit 1
fi

FOLDER1="$1"
FOLDER2="$2"
OUTPUT_FOLDER="samples-diff"

# Create the output folder if it doesn't exist
mkdir -p "$OUTPUT_FOLDER"

# Loop through files in FOLDER1
for file in "$FOLDER1"/*.png; do
    # Extract just the base filename without the path
    basefile=$(basename "$file")
    
    # Check if file exists in FOLDER2
    if [ -e "$FOLDER2/$basefile" ]; then
        # Compare the files
        cmp -s "$FOLDER1/$basefile" "$FOLDER2/$basefile"
        
        # If files are different ($? is the exit status of last command, 1 means different for cmp)
        if [ $? -eq 1 ]; then
            # Copy the files to the output folder with the appropriate naming scheme
            cp "$FOLDER1/$basefile" "$OUTPUT_FOLDER/${basefile%.*}_before.png"
            cp "$FOLDER2/$basefile" "$OUTPUT_FOLDER/${basefile%.*}_after.png"
        fi
    fi
done

OUTPUT_MD="sample_differences.md"

# Start the table with headers
echo "| Sample Name | Before | After |" > $OUTPUT_MD
echo "|-------------|--------|-------|" >> $OUTPUT_MD

# Loop through *_before.png files in the output folder
for before_file in "$OUTPUT_FOLDER"/*_before.png; do
    # Extract just the base filename without the path and the '_before' suffix
    basefile=$(basename "$before_file" _before.png)
    
    # Construct the path to the corresponding after file
    after_file="$OUTPUT_FOLDER/${basefile}_after.png"
    
    # Check if the after file exists
    if [ -e "$after_file" ]; then
        # Add an entry to the markdown table
        echo "| $basefile | ![before]($before_file) | ![after]($after_file) |" >> $OUTPUT_MD
    fi
done
