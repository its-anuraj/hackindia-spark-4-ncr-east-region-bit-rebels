export async function simulateEmailSend(employeeEmail: string) {
  return new Promise<{ success: boolean; notification: string; emailStatus: string }>((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        notification: `Email delivery queued for ${employeeEmail}`,
        emailStatus: 'sent'
      })
    }, 1500 + Math.random() * 1000)
  })
}

export async function assignProjectToEmployee(employeeId: string, employeeName: string, employeeEmail: string) {
  // Simulates the backend saving notification in the database and triggering email
  const message = `Project assigned to ${employeeName}`
  const timestamp = new Date().toISOString()
  
  // Here backend would save: { employeeId, message, timestamp }
  console.log('Saved to DB:', { employeeId, message, timestamp })

  // Trigger email simulation
  await new Promise(r => setTimeout(r, 500))

  return {
    success: true,
    notification: message,
    emailStatus: 'pending_simulation'
  }
}
