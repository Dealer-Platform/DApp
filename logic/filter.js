module.exports = {

  voters_byItem(votings, itemKey) {
    let assignedUsers = [];
    for (let i = 0; i < votings.rows.length; i++) {
      if (votings.rows[i].itemKey === itemKey) {
        assignedUsers.push(votings.rows[i].voter);
      }
    }
    return assignedUsers
  },

  votings_byItem(votings, itemKey) {
    let assignedUsers = [];
    for (let i = 0; i < votings.rows.length; i++) {
      if (votings.rows[i].itemKey === itemKey) {
        assignedUsers.push(votings.rows[i]);
      }
    }
    return assignedUsers
  },
}