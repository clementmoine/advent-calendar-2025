#!/usr/bin/env node

/**
 * Script de production qui lance Next.js en mode production avec watch
 * Rebuild automatiquement quand les fichiers changent
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
    if (code !== 0 && !options.ignoreExitCode) {
      console.error(`${command} exited with code ${code}`);
    }
  });

  return child;
}

function main() {
  console.log('🚀 Starting production environment with watch...');
  console.log('📝 Building games configuration...');

  // D'abord, générer la config des jeux
  const buildGames = runCommand('pnpm', ['run', 'build:games']);

  buildGames.on('exit', code => {
    if (code === 0) {
      console.log('✅ Games configuration built successfully');

      // Ensuite, construire le dictionnaire
      console.log('📚 Building dictionary snapshot...');
      const buildDictionary = runCommand('pnpm', ['run', 'build:dictionary']);

      buildDictionary.on('exit', dictCode => {
        if (dictCode === 0) {
          console.log('✅ Dictionary snapshot built successfully');

          // Build Next.js en mode production
          console.log('🏗️  Building Next.js for production...');
          const buildNext = runCommand('npx', ['next', 'build'], {
            ignoreExitCode: false,
          });

          buildNext.on('exit', buildCode => {
            if (buildCode === 0) {
              console.log('✅ Production build completed');
              console.log('🌐 Starting Next.js production server...');

              // Lancer le serveur de production
              let nextServer = runCommand('pnpm', ['start']);

              // Watch les fichiers source pour rebuilder
              console.log('👀 Watching for file changes...');
              const watchGames = runCommand('pnpm', ['run', 'dev:watch-games'], {
                stdio: 'pipe',
              });
              const watchDictionary = runCommand('pnpm', [
                'run',
                'dev:watch-dictionary',
              ], {
                stdio: 'pipe',
              });

              // Watch les fichiers source pour rebuilder Next.js
              const watchSource = runCommand('npx', [
                'nodemon',
                '--watch',
                'src',
                '--watch',
                'next.config.ts',
                '--ext',
                'ts,tsx,js,jsx,json',
                '--ignore',
                'src/games',
                '--ignore',
                '.next',
                '--ignore',
                'node_modules',
                '--delay',
                '2',
              ], {
                stdio: 'pipe',
              });

              let isRebuilding = false;
              let rebuildTimeout;

              // Fonction pour rebuilder et redémarrer le serveur
              const rebuildAndRestart = () => {
                if (isRebuilding) {
                  return; // Éviter les rebuilds multiples simultanés
                }

                isRebuilding = true;
                console.log('🔄 Changes detected, rebuilding...');
                
                if (nextServer) {
                  nextServer.kill('SIGTERM');
                }

                // Build les jeux et le dictionnaire d'abord
                const buildGames = runCommand('pnpm', ['run', 'build:games'], {
                  stdio: 'pipe',
                });

                buildGames.on('exit', gamesCode => {
                  if (gamesCode === 0) {
                    const buildDict = runCommand('pnpm', ['run', 'build:dictionary'], {
                      stdio: 'pipe',
                    });

                    buildDict.on('exit', dictCode => {
                      if (dictCode === 0) {
                        const rebuild = runCommand('npx', ['next', 'build'], {
                          stdio: 'inherit',
                        });

                        rebuild.on('exit', rebuildCode => {
                          isRebuilding = false;
                          if (rebuildCode === 0) {
                            console.log('✅ Rebuild completed, restarting server...');
                            nextServer = runCommand('pnpm', ['start']);
                          } else {
                            console.error('❌ Rebuild failed, keeping old server');
                            // Redémarrer quand même le serveur avec l'ancien build
                            nextServer = runCommand('pnpm', ['start']);
                          }
                        });
                      } else {
                        isRebuilding = false;
                        console.error('❌ Failed to rebuild dictionary');
                      }
                    });
                  } else {
                    isRebuilding = false;
                    console.error('❌ Failed to rebuild games');
                  }
                });
              };

              // Redémarrer Next.js quand les jeux changent
              watchGames.stdout?.on('data', data => {
                const output = data.toString();
                if (output.includes('✅ Games configuration generated!')) {
                  clearTimeout(rebuildTimeout);
                  rebuildTimeout = setTimeout(rebuildAndRestart, 1000);
                }
              });

              // Redémarrer Next.js quand le dictionnaire change
              watchDictionary.stdout?.on('data', data => {
                const output = data.toString();
                if (output.includes('Dictionary snapshot written:')) {
                  clearTimeout(rebuildTimeout);
                  rebuildTimeout = setTimeout(rebuildAndRestart, 1000);
                }
              });

              // Redémarrer Next.js quand les fichiers source changent
              watchSource.stdout?.on('data', data => {
                const output = data.toString();
                if (output.includes('restarting')) {
                  clearTimeout(rebuildTimeout);
                  rebuildTimeout = setTimeout(rebuildAndRestart, 1000);
                }
              });

              // Gérer l'arrêt propre
              process.on('SIGINT', () => {
                console.log('\n🛑 Shutting down production environment...');
                if (nextServer) nextServer.kill('SIGINT');
                watchGames.kill('SIGINT');
                watchDictionary.kill('SIGINT');
                watchSource.kill('SIGINT');
                process.exit(0);
              });
            } else {
              console.error('❌ Failed to build Next.js');
              process.exit(1);
            }
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

