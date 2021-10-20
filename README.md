Auth Gateway
=========================================================================

**WARNING: THIS IS AN EXPERIMENT IN EARLY DEVELOPMENT. IT IS SUBJECT TO FREQUENT BREAKING CHANGES,
AND IS NOT GUARANTEED TO WORK WELL OR EVEN AT ALL.**

This is a library and reference implementation for a production-grade Authn/z gateway. It performs
the following functions:

* Validates client ID and (optional) secret against database records
* (optional) Rate-limits requests from clients
* Registers new users
* Validates user data (session token or oauth (TODO)), if passed
* Generates new session credentials for users on valid authentication (including optional 2fa)
* Enforces configurable restrictions on clients
* Manages relationships between organizations, clients and users.
* TODO: Generates new oauth credentials on valid request

It is intended to be used as a front door to a collection of microservices. For example, say you
have an exchange service, a market data service, a currencies service and a monitoring service. You
would access all of those separate services through an instance of this gateway via urls such as
`/exchange/v1`, `/market-data/v1`, `/currencies/v1` and `/monitoring/v1`. You can maintain separate
versions of each service by using different version specifiers (which you would configure in the
database for this service to route to separate instances), and each service would get a uniform
[Request Info object](https://github.com/wymp/ts-types/blob/c186ce316dc689cd7b913abde3ceb4bb562b7da4/src/Auth.ts#L4)
containing information about the request such as the client from which the request was issued and
its associated roles, and the user that made the request and their roles.

This service has built endpoints for account management at `/accounts/v1`. Those endpoints facilitate
things like user creation, login, organization management, etc.

At the time of this writing, basic user creation and authentication works correctly, meaning you can
create a user and log in and log out of a session for that user.

### Authentication

Every authentication system will have its own flow. Following is a detailed description of the flow
presented by this system:

* Authentication is a multistep process where the next step is returned in response to the last
  submission until a session is finally returned. Steps are submitted via the
  [`POST /accounts/v1/sessions/login/:step` endpoint](/docs/api.v1.html#tag/Sessions).
* If the submission returns a response with type `sessions`, then it is a session and no further
  steps are required.
* The first step you submit will usually be either [`email`](/docs/api.v1.html#operation/post-accounts-v1-sessions-login-step)
  or [`password`](/docs/api.v1.html#operation/post-accounts-v1-sessions-login-password).
* A "step" response is identified by a `t` value which is `"steps"`, while a "session" response is
  identified by a `t` value which is `"sessions"`. In the event of an error, the `t` value is
  `"error"`. When a "step" response is received, the `step` parameter will contain the next
  step to submit. Clients are responsible for knowing the necessary parameters to submit for each
  step.

### Using Session and Refresh Tokens

Successful authentication results in a `sessions` object containing a `token` value and a `refresh`
value. The `token` value is to be used to make requests against the API, while the `refresh` value
is to be used to obtain new values when the token expires.

Additionally, either value may be used to log out (i.e., invalidate) a session.

To refresh a session using a refresh token, submit a payload to the `POST /accounts/v1/sessions/refresh`
endpoint as indicated in the [API docs](/docs/api.v1.html#operation/post-accounts-v1-sessions-refresh).
The response will be a session object with new "refresh" and "token" values.

To log out of a session, submit a request to the `POST /accounts/v1/sessions/logout` endpoint in
accordance with the [API docs](/docs/api.v1.html#operation/post-accounts-v1-sessions-logout).


### Running

#### Database

This service is expecting a MySQL database. It provides a database schema in the `db/migrations`
folder which may be applied using `shmig`. `shmig` is a small, lightweight shell-based database
migration framework for various SQL servers (including MySQL).

You can install shmig on Debian-based machines by installing the apt repo [here](https://packages.kaelshipman.me/)
and then running `sudo apt-get install shmig`. Alternatively, you can go to the Wymp fork of the
shmig repo [here](https://github.com/wymp/shmig/) and just download and install the file directly.

When you have shmig installed, just create a new database and user (if necessary), add those
credentials to your `shmig.local.conf` file, cd into `db` and run `shmig up`.

### TODO

#### Accounts Endpoints

* [x] **Organizations**
  * [x] GET    /accounts/v1/organizations
  * [x] POST   /accounts/v1/organizations
  * [x] GET    /accounts/v1/organizations/:id
  * [x] PATCH  /accounts/v1/organizations/:id
  * [x] DELETE /accounts/v1/organizations/:id
* [ ] **Users**
  * [x] GET    /accounts/v1/users
  * [x] POST   /accounts/v1/users
  * [x] GET    /accounts/v1/users/:id
  * [x] PATCH  /accounts/v1/users/:id
  * [x] DELETE /accounts/v1/users/:id
  * [ ] GET    /accounts/v1/users/:id/roles
  * [ ] POST   /accounts/v1/users/:id/roles
  * [ ] DELETE /accounts/v1/users/:id/roles/:roleId
  * [x] POST   /accounts/v1/users/:id/change-password
* [ ] **Emails**
  * [ ] GET    /accounts/v1/users/:id/emails
  * [ ] POST   /accounts/v1/users/:id/emails
  * [ ] DELETE /accounts/v1/emails/:id
  * [ ] POST   /accounts/v1/emails/:id/verify
* [ ] **Clients**
  * [ ] GET    /accounts/v1/clients/:id
  * [ ] PATCH  /accounts/v1/clients/:id
  * [ ] DELETE /accounts/v1/clients/:id
  * [ ] GET    /accounts/v1/clients/:id/roles
  * [ ] POST   /accounts/v1/clients/:id/roles
  * [ ] DELETE /accounts/v1/clients/:id/roles
  * [ ] GET    /accounts/v1/clients/:id/access-restrictions
  * [ ] POST   /accounts/v1/clients/:id/access-restrictions
  * [ ] DELETE /accounts/v1/clients/:id/access-restrictions
  * [ ] GET    /accounts/v1/organizations/:id/clients
  * [ ] POST   /accounts/v1/organizations/:id/clients
* [x] **Memberships**
  * [x] GET    /accounts/v1/users/:id/memberships
  * [x] GET    /accounts/v1/organizations/:id/memberships
  * [x] POST   /accounts/v1/organizations/:id/memberships
  * [x] PATCH /accounts/v1/org-memberships/:id
  * [x] DELETE /accounts/v1/org-memberships/:id
* [-] **Sessions**
  * [x] GET    /accounts/v1/sessions
  * [x] GET    /accounts/v1/users/:id/sessions
  * [-] POST   /accounts/v1/sessions/login/email
  * [x] POST   /accounts/v1/sessions/login/password
  * [x] POST   /accounts/v1/sessions/login/code
  * [-] POST   /accounts/v1/sessions/login/totp
  * [x] POST   /accounts/v1/sessions/refresh
  * [x] POST   /accounts/v1/sessions/logout

#### General

* [ ] Implement TOTP flow and infrastructure
* [ ] Implement API regression tests
* [ ] Use TypeDoc to create library documentation
* [ ] Implement hook system that allows for alternate handling and/or system extensibility
* [ ] Export library functions correctly

#### Later Improvements

* [ ] Implement data transactions in database for things like user creation
* [ ] Fix lots of things around `verification-codes`. We need to refactor around the idea that the
      `state` parameter passed in by a user represents a certain login flow execution, rather than
      having it be somewhat tangential. This flows into login code and totp authn flows.
  * [ ] Currently they require an email address, but in some cases we would prefer to associated a
        userId
  * [ ] We've switched back to calling the user generated token "state", and we should reflect that
        in the database.
* [ ] Refactor `session-tokens` to have `tokenSha256` and `refreshTokenSha256` all together. When a
      refresh token is consumed or invalidated, the associated session token should also be consumed
      or invalidated, and that should be verified by the gateway. I.e., users should not be able to
      use session tokens associated with consumed refresh tokens to successfully make requests.
* [ ] Protect email addresses as PII
* [ ] Implemented generalized multi-step process for dangerous operations (e.g., DELETE user). This
      would mean, for example, any endpoint could return an `auth-step` or something, and an auth
      flow would ensue, resulting in completion of the operation being attempted.

