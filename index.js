/* ------------- Globals ------------- */
var APP_ID,
  DESK_API_TOKEN,
  ticketSearchTimeoutId,
  agentId,
  ticketId,
  htmlKey

/* ------------- Element selectors ------------- */
const loginScreen = document.querySelector('#login-screen')
const loginAppIdInput = document.querySelector('#login-app-id')
const loginDeskApiTokenInput = document.querySelector('#login-desk-api-token')
const loginButton = document.querySelector('#login-button')
const searchWrapper = document.querySelector('.search-wrapper')
const ticketSearchInput = document.querySelector('#ticket-search')
const resultsWrapper = document.querySelector('#results-wrapper')
const resultsList = document.querySelector('#results-list')

var tickets = JSON.parse(localStorage.getItem('tickets')) || null
getSavedCredentials()

/* ------------- Event listeners ------------- */
loginAppIdInput.addEventListener('input', appIdInputHandler)
loginDeskApiTokenInput.addEventListener('input', deskApiTokenInputHandler)
ticketSearchInput.addEventListener('input', ticketSearchInputHandler)
loginButton.addEventListener('click', init)

/* ------------- Event handlers ------------- */
function appIdInputHandler() {
  APP_ID = loginAppIdInput.value
  loginButton.disabled = (!APP_ID || !DESK_API_TOKEN)
}
function deskApiTokenInputHandler() {
  DESK_API_TOKEN = loginDeskApiTokenInput.value
  loginButton.disabled = (!APP_ID || !DESK_API_TOKEN)
}
function ticketSearchInputHandler() {
  searchTickets(ticketSearchInput.value)
}
async function init() {
  hideResults()
  hideSearch()
  getDataFromUrl()
  saveCredentials()

  if (!tickets) {
    await getTickets()
  }
  hideLogin()
  showSearch()
}

/* ------------- Display helpers ------------- */
function hideLogin() {
  loginScreen.style.display = 'none'
}
function showSearch() {
  searchWrapper.style.display = 'block'
}
function hideSearch() {
  searchWrapper.style.display = 'none'
}
function showResults() {
  resultsList.innerHTML = tickets && tickets.length
    ? tickets.map(ticket => `
        <li class="result-list-item">
          <a href="https://dashboard.sendbird.com/${APP_ID}/desk/tickets/${ticket.id}" target='_parent'>
            ${ticket.channelName} | <span>${ticket.group.name}</span> | <span>${ticket.status2}</span>
          </a>
        </li>
      `).join('')
    : '<li>No results found</li>'
  resultsWrapper.style.display = 'block'
}
function hideResults() {
  resultsWrapper.style.display = 'none'
  resultsList.innerHTML = ''
}

/* ------------- Utility functions ------------- */
async function searchTickets(searchTerm) {
  if (searchTerm && searchTerm.length <= 3) {
    return
  }
  if (ticketSearchTimeoutId) {
    clearTimeout(ticketSearchTimeoutId)
  }
  ticketSearchTimeoutId = null
  ticketSearchTimeoutId = setTimeout(async () => {
    getTickets(searchTerm)
  }, 500)
}
async function getTickets(q, _next) {
  // More parameters here: https://sendbird.com/docs/desk/v1/platform-api/guides/ticket#2-list-tickets-3-parameters
  const params = {
    q,
    limit: 100,
    next: _next,
    agent: agentId,
  }
  const urlParamsString = new URLSearchParams(params).toString()
  const apiRoute = `https://desk-api-${APP_ID}.sendbird.com/platform/v1/tickets?${urlParamsString}`

  const response = await fetch(apiRoute, {
    headers: { 'SENDBIRDDESKAPITOKEN': DESK_API_TOKEN },
    mode: 'cors'
  })
  if (response.status !== 200) {
    console.log("\n❌ Failed request: ", response.status + " - " + response.statusText)
    if (response.status === 400) {
      const { message } = await response.json()
      console.log(`❌ Error message: ${message}`)
    }
    return
  }

  const { results, next } = await response.json()
  tickets = [...results]
  if (next) {
    tickets.push(...await getTickets(q, next))
  }

  if (!q) {
    localStorage.setItem('tickets', JSON.stringify(tickets))
  }
  showResults()
}
function getDataFromUrl () {
  const url = new URL(document.location.href)
  agentId = url.searchParams.get('agent_id')
  ticketId = url.searchParams.get('ticket_id')
  // Check the html key here for validation
  htmlKey = url.searchParams.get('html_key')
}
function getSavedCredentials() {
  APP_ID = localStorage.getItem('app_id')
  DESK_API_TOKEN = localStorage.getItem('desk_api_token')
  loginAppIdInput.value = APP_ID
  loginDeskApiTokenInput.value = DESK_API_TOKEN
  if (APP_ID && DESK_API_TOKEN) {
    loginButton.disabled = false
  }
}
function saveCredentials() {
  localStorage.setItem('app_id', APP_ID)
  localStorage.setItem('desk_api_token', DESK_API_TOKEN)
}