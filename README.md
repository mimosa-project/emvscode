# Mizar extension
* Visual Studio Code Extension for Mizar

## Note
* This extension only works on Windows.

## Demo
### Command execution
![demo](https://user-images.githubusercontent.com/32231297/92366947-c68bdb00-f130-11ea-8dd0-52ef3641e9cb.gif)

### Syntax highlight & Auto indent
![auto_indent](https://user-images.githubusercontent.com/32231297/93070316-af616600-f6b9-11ea-85b5-3deb887da308.gif)

### Hover information
![demo2](https://user-images.githubusercontent.com/32231297/92366998-d6a3ba80-f130-11ea-9f76-8117f82a03ea.gif)
## Features
### Implemented
* Mizar commands
    * Mizar Compile
    * Run Mizar
    * Irrelevant Theorems
    * Irrelevant Iterative Steps
    * Irrelevant Inferences
    * Irrelevant Premises
    * Inaccessible Items
    * Trivial Proofs
    * Irrelevant Vocabularie
* Syntax highlight
* Auto indent
* Hover information
* Go to definition

### Under development
* Auto completion

## Installation
1. Open VSCode and type "Ctrl+Shift+X".  
2. Type "mizar" in the search box and click to install.

## Usage
* Command Execution
    * Type "Ctrl+Shift+P" (or click title bar icon) and choose a command.

## Development
* Clone this repositry
    ```
    git clone https://github.com/mimosa-project/emvscode
    ```
* Change the current directory to emvscode directory
    ```
    cd emvscode
    ```
* Run "npm install"
    ```
    npm install
    ```
* Open VSCode and press F5
    * This will compile and run the extension in a new Extension Development Host window
* reference
    * https://code.visualstudio.com/api/get-started/your-first-extension

## Running the tests
* Select "Extension Tests" and run.
* ![running-tests](https://user-images.githubusercontent.com/32231297/95474056-a82f2e80-09bf-11eb-9b03-250de546b38a.png)

## Author
* Hiroto Taniguchi

## License
This project is licensed under the MIT License - see the LICENSE file for details.  
