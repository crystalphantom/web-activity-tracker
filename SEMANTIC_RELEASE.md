# 🤖 Fully Automated Release System

Your extension now has **zero-touch releases** with semantic versioning!

## 🎯 How It Works

### **Commit → Auto Release → Auto Update**
1. **Push to main** → Analyzes commits → Determines version → Creates release
2. **Auto-generated changelog** from commit messages
3. **Auto-updated install scripts** with new version
4. **Auto-built extension** uploaded as release asset

## 📝 Conventional Commits

Use `npm run commit` for guided commits:

### **Types:**
- `feat:` New feature (patch/minor)
- `fix:` Bug fix (patch)
- `docs:` Documentation (no version)
- `style:` Code style (no version)
- `refactor:` Code refactoring (no version)
- `perf:` Performance improvement (minor)
- `test:` Tests (no version)
- `chore:` Build/tools (no version)

### **Examples:**
```bash
npm run commit
# ? Select the type of change that you're committing: feat
# ? What is the scope of this change (e.g. component or file name): popup
# ? Write a short, imperative tense description of the change: add dark mode toggle
# ? Provide a longer description of the change: 
# ? Are there any breaking changes? No
# ? Does this change affect any open issues? No
```

## 🚀 Release Process

### **Automatic (Recommended):**
```bash
# Make changes with conventional commits
git add .
npm run commit
git push origin main
# 🎉 Release created automatically!
```

### **Manual:**
```bash
npm run release
```

## 📋 What Gets Automated

- ✅ **Version bumping** based on commit types
- ✅ **Git tags** created automatically
- ✅ **GitHub releases** with changelog
- ✅ **Extension builds** uploaded as assets
- ✅ **Install scripts** updated with new version
- ✅ **CHANGELOG.md** generated and committed

## 📦 For Users

Always the same command - automatically gets latest version:
```bash
curl -sSL https://raw.githubusercontent.com/crystalphantom/web-activity-tracker/main/scripts/install.sh | bash
```

## 🔧 Git Hooks

- **Pre-push**: Runs linting and build
- **Commit-msg**: Validates conventional commit format

## 📊 Version Rules

- **Major**: `feat!:` or `BREAKING CHANGE`
- **Minor**: `feat:` new features
- **Patch**: `fix:` bug fixes

## 🎉 Benefits

- **No manual version management**
- **Professional changelogs**
- **Consistent releases**
- **Zero-touch deployment**
- **Semantic versioning**

Just push conventional commits to main branch - everything else is automated! 🚀