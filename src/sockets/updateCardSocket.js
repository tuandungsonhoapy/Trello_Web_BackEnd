export const updateCardSocket = (client) => {
  client.on('fe-update-card', (newCard) => {
    client.broadcast.emit('be-update-card', newCard)
  })
}
