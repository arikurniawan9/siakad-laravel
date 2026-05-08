import { spawnSync } from 'node:child_process';

function shouldSeed() {
    const env = String(process.env.APP_ENV || '').toLowerCase();
    const explicit = String(process.env.SEED_ON_BUILD || '').toLowerCase();

    if (explicit === '1' || explicit === 'true' || explicit === 'yes') return true;
    if (explicit === '0' || explicit === 'false' || explicit === 'no') return false;

    // Default policy: seed automatically only for local/dev-like environments.
    return env === '' || env === 'local' || env === 'development' || env === 'dev';
}

function run(cmd, args) {
    const result = spawnSync(cmd, args, { stdio: 'inherit', shell: false });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!shouldSeed()) {
    process.stdout.write('[postbuild] Skip db:seed (set SEED_ON_BUILD=1 to force)\n');
    process.exit(0);
}

const seedClass = process.env.SEED_CLASS ? String(process.env.SEED_CLASS) : null;
const args = ['artisan', 'db:seed', '--force'];
if (seedClass) args.push(`--class=${seedClass}`);

process.stdout.write('[postbuild] Running php artisan db:seed --force\n');
run('php', args);

