'use strict';

const build = require('@microsoft/sp-build-web');

build.addSuppression(
  `Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`
);

var getTasks = build.rig.getTasks;

build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);

  result.set('serve', result.get('serve-deprecated'));

  return result;
};

// ---------------------------------------------------------
// DEBUG BUILD ERRORS
// ---------------------------------------------------------

process.on('uncaughtException', function (error) {
  console.error('\n\n========================================');
  console.error('UNCAUGHT EXCEPTION');
  console.error('========================================\n');

  console.error('name:', error && error.name);
  console.error('message:', error && error.message);
  console.error('stack:', error && error.stack);

  console.error('\nFULL ERROR OBJECT:\n');
  console.dir(error, {
    depth: null,
    colors: true
  });

  console.error('\n========================================\n');
});

process.on('unhandledRejection', function (reason) {
  console.error('\n\n========================================');
  console.error('UNHANDLED PROMISE REJECTION');
  console.error('========================================\n');

  console.error('reason:');

  console.dir(reason, {
    depth: null,
    colors: true
  });

  if (reason instanceof Error) {
    console.error('\nStack:');
    console.error(reason.stack);
  }

  console.error('\n========================================\n');
});

build.initialize(require('gulp'));