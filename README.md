# Mizar extension
VSCode Extension for Mizar
## Getting Started
### Prerequisites
You have to install following softwares.
* VisualStudioCode
    * https://code.visualstudio.com/
* Mizar
    * https://mizar.org/system/#download
* Node.js and Yeoman and VS Code Extension Generator
    * https://code.visualstudio.com/api/get-started/your-first-extension

### Installing
You can download this project from below URL.  
https://github.com/mimosa-project/emvscode  
## Running the tests
In this extension, you can use "npm run test" to run the tests.  
To run tests, you have to close all VSCode windows.  
Please check the following.  
https://code.visualstudio.com/api/working-with-extensions/testing-extension  
## Deployment
1. In VSCode, push (Ctrl+Shift+X) and search "mizar".  
2. Click the extesnion to install.  

## How to use this extension
There are 9 commands of mizar in this extension.  
To use these commands, you have to push (Ctrl+Shift+P) and choose a command.  
The result of command will be displayed on output channel.  
Except for mizar-verify2, all commands show clickable errors on output channel and Problems tabs.  
### 1.mizar-verify
mizar-verify runs makeenv and verifier.  
### 2.mizar-verify2
mizar-verify2 runs makeenv and verifier.  
This command adds error flags in the editing file.  
This is same as traditional Mizar way.   
### 3.mizar-irrths
mizar-irrths runs makeenv and irrths.  
### 4.mizar-reliters
mizar-reliters runs makeenv and reliters.  
### 5.mizar-relinfer
mizar-relinfer runs makeenv and relinfer.  
### 6.mizar-relprem
mizar-relprem runs makeenv and relprem.  
### 7.mizar-inacc
mizar-inacc runs makeenv and inacc.  
### 8.mizar-trivdemo
mizar-trivdemo runs makeenv and trivdemo.  
### 9.mizar-irrvoc
mizar-irrvoc runs makeenv and irrvoc.  

## Built With
* Visual Studio Code  
## Authors
* Hiroto Taniguchi  
## License
This project is licensed under the MIT License - see the LICENSE file for details.  
