/*

Migration description

*/

function migration(state) {
  console.log('Running first pair status migration');
  return {
    ...state,
  };
}

export default migration;
