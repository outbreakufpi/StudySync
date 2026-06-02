describe('Protection and auth flow (smoke)', () => {
  const base = 'http://localhost:3001';

  it('redirects unauthenticated browser navigation to login', () => {
    cy.visit(`${base}/pages/home/index.html`, {failOnStatusCode: false});
    cy.location('pathname', {timeout: 10000}).should('include', '/pages/login/index.html');
  });

  it('API returns 401 when no token provided', () => {
    cy.request({
      method: 'GET',
      url: `${base}/api/v1/subjects`,
      headers: { Accept: 'application/json' },
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.be.oneOf([401, 403]);
      // body should be JSON with error
      expect(resp.body).to.have.property('error');
    });
  });

  it('invalid bearer token for HTML request redirects to login', () => {
    cy.request({
      method: 'GET',
      url: `${base}/pages/home/index.html`,
      headers: { Accept: 'text/html', Authorization: 'Bearer invalidtoken' },
      followRedirect: false,
      failOnStatusCode: false,
    }).then((resp) => {
      // server should return a redirect to login
      expect([302, 303]).to.include(resp.status);
      expect(resp.headers).to.have.property('location');
      expect(resp.headers.location).to.include('/pages/login/index.html');
    });
  });
});
