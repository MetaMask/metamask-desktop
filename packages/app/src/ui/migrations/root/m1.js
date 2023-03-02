/*

Migration description

*/

function migration(state) {
  console.log('Running first root migration');
  return {
    ...state,
  };
}

export default migration;
