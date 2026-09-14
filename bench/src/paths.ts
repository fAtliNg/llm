import path from 'node:path';

export const BENCH_DIR = path.resolve(import.meta.dirname, '..');
export const REPO_DIR = path.resolve(BENCH_DIR, '..');
export const TEMPLATE_DIR = path.join(REPO_DIR, 'template');
export const TASKS_DIR = path.join(BENCH_DIR, 'tasks');
export const CONFIGS_DIR = path.join(BENCH_DIR, 'configs');
export const WORK_DIR = path.join(BENCH_DIR, '.work');
export const RESULTS_DIR = path.join(BENCH_DIR, 'results');
export const PI_HOME = path.join(BENCH_DIR, 'pi-home');
export const PI_BIN = path.join(BENCH_DIR, 'node_modules', '.bin', 'pi');
export const HIDDEN_TESTS_DIR = 'src/__bench__';
