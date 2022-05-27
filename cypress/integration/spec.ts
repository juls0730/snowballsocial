describe('My First Test', () => {
  it('Visits the login page', () => {
    cy.visit('/login')
    cy.contains('SnowballSocial')
    cy.contains('Sign Up')
    cy.contains('Email or username')
    cy.get('input[id=emailusername]').focus().type('test1')
    cy.get('input[id=password]').focus().type('password123')
    cy.get('button').click()
  })

  it('submits a new post', () => {
    cy.get('textarea[id=content]').focus().type('This is a test post')
    cy.get('button').contains('Save Post').click()
    cy.get('div[id=posts]').get('div[class=post-div]').get('p[class=post-text]').contains('This is a test post')
  })

  it('navigates to the new post', () => {
    cy.get('div[id=posts]').get('div[class=post-div]').get('p[class=post-text]').contains('This is a test post').click()
  })

  it('likes the new post and makes a comment', () => {
    cy.get('div[id=heart-container]').click()
    cy.get('textarea[id=reply').focus().type('This is a test comment')
    cy.get('button').contains('Reply').click()
  })

  it('likes the new reply', () => {
    cy.get('div[id=reply-div]').get('p[class=post-text]').contains('This is a test comment')
    cy.get('div[id=reply-div] > div[class=post-actions] > div[class=heart-container]').click()
  })

  it('navigates to the users profile', () => {
   cy.get('nav[class=md-nav] > ul >div[class=end]').click() 
   cy.get('nav[class=md-nav] > div[id=dropdown-content-user] > div[class=dropdown-user-links] > button[class=dropdown-buttons]').contains('Profile').click()
  })

  it('logs out', () => {
    cy.get('nav[class=md-nav] > div[id=dropdown-content-user] > div[class=dropdown-user-links] > button[class=dropdown-buttons]').contains('Logout').click()
  })
})
