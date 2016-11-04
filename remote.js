const path = require('path')
const remote = require('screeps-remote')

remote({
  // required
  username: 'username', // MUST change (or use the SCREEPS_USERNAME envvar)
  password: '*******', // MUST change (or use the SCREEPS_PASSWORD envvar)

  // optional
  src: path.resolve(__dirname, './dist/out'), // defaults to the working directory if not specified (or use the SCREEPS_SOURCE envvar)
  branch: 'default', // defaults to "default" if not provided (or use the SCREEPS_BRANCH envvar)
  ptr: false // defaults to `false` if not provided (or use the SCREEPS_PTR envvar)
})
