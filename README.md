# Stargazer

A tactical hex grid game built with Vue 3 and TypeScript. Place characters on a hex grid battlefield, watch them automatically target enemies, and experiment with different team compositions and strategies.

## What is this project?

Stargazer is an interactive hex grid game where you can:

- **Drag and drop characters** from a roster onto hex tiles
- **Build teams** by placing characters on ally and enemy tiles
- **Watch automatic targeting** as characters find their closest opponents
- **Experiment with tactics** using different map layouts and team compositions
- **Move and swap characters** already on the grid
- **Switch between maps** to explore different battlefields

The game uses a sophisticated drag-and-drop system that automatically assigns characters to teams based on where you drop them, making it easy to set up battles and test strategies.

## For New Contributors

This project is beginner-friendly! If you're new to coding, here's what you'll be working with:

- **Vue.js** - A popular web framework for building user interfaces
- **TypeScript** - JavaScript with type safety to catch errors early
- **Hex grids** - Six-sided tile systems common in strategy games
- **Drag and drop** - Interactive user interface patterns

Don't worry if these terms are unfamiliar - the codebase is well-organized and documented to help you learn as you contribute.

## Prerequisites

Before you start, make sure you have these installed on your computer:

### Required Software

1. **Node.js** (version 18 or newer)
   - Download from [nodejs.org](https://nodejs.org/)
   - This includes `npm` (Node Package Manager) which you'll need

2. **Git** (for version control)
   - Download from [git-scm.com](https://git-scm.com/)
   - Used to download and contribute to the project

3. **Code Editor** (recommended)
   - [Visual Studio Code](https://code.visualstudio.com/) with these extensions:
     - [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) - Vue.js support
     - [TypeScript Vue Plugin](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) - Better TypeScript support

### Verifying Your Installation

Open your terminal/command prompt and run these commands to check:

```bash
node --version    # Should show v18.0.0 or higher
npm --version     # Should show a version number
git --version     # Should show a version number
```

## Getting Started

### 1. Get the Code

First, download the project to your computer:

```bash
# Clone the repository
git clone <repository-url>
cd stargazer
```

### 2. Install Dependencies

Install all the packages the project needs:

```bash
npm install
```

This might take a few minutes the first time. You'll see lots of text scroll by - that's normal!

### 3. Start the Development Server

Run the project locally:

```bash
npm run dev
```

You should see output like:
```
Local:   http://localhost:5173/
Network: http://192.168.1.100:5173/
```

Open the "Local" URL in your web browser to see the game!

### 4. Make Your First Change

Try editing a file to see how development works:

1. Open `src/views/Home.vue` in your code editor
2. Find some text in the file and change it
3. Save the file
4. Look at your browser - it should automatically update!

This is called "hot reload" - your changes appear instantly without refreshing.

## Available Commands

Here are the main commands you'll use while developing:

```bash
# Start development server with hot reload
npm run dev

# Check for TypeScript errors
npm run type-check

# Build for production (creates optimized files)
npm run build

# Format your code automatically
npm run format

# Preview production build locally
npm run preview
```

## Project Structure

Here's what the main folders contain:

```
src/
├── components/     # Reusable UI pieces (buttons, grids, etc.)
├── views/          # Main pages of the application
├── lib/            # Game logic (hex math, grid management)
├── stores/         # Application state management
├── utils/          # Helper functions
├── data/           # Character and map data (JSON files)
└── assets/         # Images and other media files
```

## Making Changes

### For Small Changes
1. Edit files in your code editor
2. Check your changes in the browser (`npm run dev`)
3. Run `npm run type-check` to catch any errors
4. Run `npm run format` to clean up your code

### For Larger Changes
1. Create a new branch: `git checkout -b my-feature-name`
2. Make your changes
3. Test them thoroughly
4. Commit your changes: `git add . && git commit -m "Description of changes"`
5. Push your branch: `git push origin my-feature-name`

## Learning Resources

If you're new to the technologies used in this project:

**Vue.js**
- [Vue.js Official Tutorial](https://vuejs.org/tutorial/)
- [Vue.js Guide](https://vuejs.org/guide/)

**TypeScript**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript for JavaScript Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)

**General Web Development**
- [MDN Web Docs](https://developer.mozilla.org/) - Comprehensive web development reference
- [freeCodeCamp](https://www.freecodecamp.org/) - Free coding bootcamp

## Getting Help

- Check the `CLAUDE.md` file for detailed technical documentation
- Look at existing code for examples of how things work
- Search for similar patterns in the codebase
- Ask questions in issues or discussions

## Contributing

We welcome contributions! Whether you're fixing typos, adding features, or improving documentation, every contribution helps. Start small, learn as you go, and don't be afraid to ask questions.

---

Happy coding! 🚀