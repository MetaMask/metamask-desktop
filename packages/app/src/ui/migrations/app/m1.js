/*

Migration description

*/

function migration(state) {
  console.log('Running first app migration');
  return {
    ...state,
  };
}

export default migration;
