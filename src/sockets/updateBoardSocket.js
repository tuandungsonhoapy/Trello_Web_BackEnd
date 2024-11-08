export const updateUserGroupSocket = (client) => {
  client.on('fe-remove-user-from-board', (newBoard) => {
    client.broadcast.emit('be-remove-user-from-board', newBoard)
  })
}
