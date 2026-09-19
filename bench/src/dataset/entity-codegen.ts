// The code generator lives in the template (scripts/entity-codegen.ts), where the model uses it through
// `npm run gen:entity`; the pool generator imports the same file so that both produce identical code.
export * from '../../../template-fullstack/scripts/entity-codegen.ts';
