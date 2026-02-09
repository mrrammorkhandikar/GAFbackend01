// Frontend API Service Example
// Place this in your frontend project to connect to the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

class ApiService {
  // Admin Authentication
  static async adminLogin(credentials) {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })
    return response.json()
  }

  static async getAdminStats() {
    const response = await fetch(`${API_BASE_URL}/admin/stats`)
    return response.json()
  }

  // Campaigns
  static async getCampaigns(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    const response = await fetch(`${API_BASE_URL}/campaigns?${queryParams}`)
    return response.json()
  }

  static async getCampaign(id) {
    const response = await fetch(`${API_BASE_URL}/campaigns/${id}`)
    return response.json()
  }

  static async createCampaign(formData) {
    const response = await fetch(`${API_BASE_URL}/campaigns`, {
      method: 'POST',
      body: formData // FormData object with image
    })
    return response.json()
  }

  static async updateCampaign(id, formData) {
    const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
      method: 'PUT',
      body: formData
    })
    return response.json()
  }

  static async deleteCampaign(id) {
    const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
      method: 'DELETE'
    })
    return response.json()
  }

  // Events
  static async getEvents(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    const response = await fetch(`${API_BASE_URL}/events?${queryParams}`)
    return response.json()
  }

  static async getEvent(id) {
    const response = await fetch(`${API_BASE_URL}/events/${id}`)
    return response.json()
  }

  // Event Registrations
  static async registerForEvent(data) {
    const response = await fetch(`${API_BASE_URL}/event-registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  static async getEventRegistrations(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    const response = await fetch(`${API_BASE_URL}/event-registrations?${queryParams}`)
    return response.json()
  }

  // Volunteer Opportunities
  static async getVolunteerOpportunities(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    const response = await fetch(`${API_BASE_URL}/volunteer-opportunities?${queryParams}`)
    return response.json()
  }

  static async getVolunteerOpportunity(id) {
    const response = await fetch(`${API_BASE_URL}/volunteer-opportunities/${id}`)
    return response.json()
  }

  static async submitVolunteerApplication(data) {
    const response = await fetch(`${API_BASE_URL}/volunteer-submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  // Careers
  static async getCareers(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    const response = await fetch(`${API_BASE_URL}/careers?${queryParams}`)
    return response.json()
  }

  static async getCareer(id) {
    const response = await fetch(`${API_BASE_URL}/careers/${id}`)
    return response.json()
  }

  static async submitCareerApplication(formData) {
    const response = await fetch(`${API_BASE_URL}/career-applications`, {
      method: 'POST',
      body: formData // FormData with resume
    })
    return response.json()
  }

  // Team
  static async getTeamMembers(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    const response = await fetch(`${API_BASE_URL}/team?${queryParams}`)
    return response.json()
  }

  // Donations
  static async createDonation(formData) {
    const response = await fetch(`${API_BASE_URL}/donations`, {
      method: 'POST',
      body: formData
    })
    return response.json()
  }

  static async getDonations(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    const response = await fetch(`${API_BASE_URL}/donations?${queryParams}`)
    return response.json()
  }

  // Contact
  static async submitContactForm(data) {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}

export default ApiService