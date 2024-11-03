export const inviteUserToBoardSocket = (client) => {
  client.on('fe-invite-user-to-board', (invitation) => {
    client.broadcast.emit('be-invite-user-to-board', invitation)
  })
}
