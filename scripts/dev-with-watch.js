#!/usr/bin/env node

/**
 * Script de développement qui lance Next.js et le watcher des jeux en parallèle
 */

const { spawn } = require('child_process');
const path = require('path');

function runCommand(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    ...options,
  });

  child.on('error', error => {
    console.error(`Error running ${command}:`, error);
  });

  child.on('exit', code => {
    if (code !== 0) {
      console.error(`${command} exited with code ${code}`);
    }
  });

  return child;
}

function main() {
  console.log('🚀 Starting development environment...');
  console.log('📝 Building games configuration...');

  // D'abord, générer la config des jeux
  const buildGames = runCommand('pnpm', ['run', 'build:games']);

  buildGames.on('exit', code => {
    if (code === 0) {
      console.log('✅ Games configuration built successfully');

      // Ensuite, construire le dictionnaire avant de démarrer le serveur
      console.log('📚 Building dictionary snapshot...');
      const buildDictionary = runCommand('pnpm', ['run', 'build:dictionary']);

      buildDictionary.on('exit', dictCode => {
        if (dictCode === 0) {
          console.log('✅ Dictionary snapshot built successfully');

          // Puis lancer Next.js et les watchers en parallèle
          console.log('🌐 Starting Next.js development server...');
          const nextDev = runCommand('pnpm', ['run', 'dev:next'], {
            stdio: 'inherit',
          });

          console.log('👀 Starting games watcher...');
          const gamesWatcher = runCommand('pnpm', ['run', 'dev:watch-games']);

          console.log('👀 Starting dictionary watcher...');
          const dictionaryWatcher = runCommand('pnpm', [
            'run',
            'dev:watch-dictionary',
          ]);

          // Redémarrer Next.js quand les jeux changent
          gamesWatcher.stdout?.on('data', data => {
            const output = data.toString();
            if (output.includes('✅ Games configuration generated!')) {
              console.log('🔄 Games updated, restarting Next.js...');
              nextDev.kill('SIGTERM');
              setTimeout(() => {
                const newNextDev = runCommand('pnpm', ['run', 'dev:next'], {
                  stdio: 'inherit',
                });
                Object.assign(nextDev, newNextDev);
              }, 1000);
            }
          });

          // Redémarrer Next.js quand le dictionnaire change
          dictionaryWatcher.stdout?.on('data', data => {
            const output = data.toString();
            if (output.includes('Dictionary snapshot written:')) {
              console.log('🔄 Dictionary updated, restarting Next.js...');
              nextDev.kill('SIGTERM');
              setTimeout(() => {
                const newNextDev = runCommand('pnpm', ['run', 'dev:next'], {
                  stdio: 'inherit',
                });
                Object.assign(nextDev, newNextDev);
              }, 1000);
            }
          });

          // Gérer l'arrêt propre
          process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down development environment...');
            nextDev.kill('SIGINT');
            gamesWatcher.kill('SIGINT');
            dictionaryWatcher.kill('SIGINT');
            process.exit(0);
          });
        } else {
          console.error('❌ Failed to build dictionary snapshot');
          process.exit(1);
        }
      });
    } else {
      console.error('❌ Failed to build games configuration');
      process.exit(1);
    }
  });
}

if (require.main === module) {
  main();
}
