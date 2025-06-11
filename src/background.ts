import { daptinClient } from './daptin'

let daptinUserAuth = {}
try {
  daptinUserAuth = JSON.parse(localStorage.getItem('DAPTIN'))
} catch (e) {
  console.error('no existing auth', e)
}
console.log('user loaded', daptinUserAuth)

var tokenTimoutReference = null

const setTokenExpiryTimeout = async () => {
  if (tokenTimoutReference != null) {
    clearTimeout(tokenTimoutReference)
  }
  const expireTokenTimestamp = daptinUserAuth.user.exp * 1000
  const currentTimestamp = Date.now()
  const timeoutDuration = expireTokenTimestamp - currentTimestamp
  const delayTime = timeoutDuration / (1000 * 60)
  const resolution = 'minutes'
  console.log(
    'setting user token timeout for ' +
      expireTokenTimestamp +
      ' after ' +
      parseInt('' + delayTime) +
      ' ' +
      resolution
  )
  tokenTimoutReference = setTimeout(async () => {
    console.log(
      'token timed out, removing user ref: ' + JSON.stringify(daptinUserAuth)
    )
    localStorage.removeItem('daptin')
    // await frontAgent.reloadToken()
    daptinUserAuth = {
      user: null,
      token: null,
      customer: null,
      creator: null,
    }
  }, timeoutDuration)
}

export async function sendMessageToBackgroundScript(request) {
  // console.log('Received Request ', request)
  return new Promise(async (resolve, reject) => {
    try {
      switch (request.type) {
        case 'getAuth':
          resolve(daptinUserAuth)
          break
        case 'signInWithEmailOtp':
          let signinWithEmailOtpResponse = []
          try {
            signinWithEmailOtpResponse =
              await daptinClient.actionManager.doAction(
                'user_account',
                'signin',
                {
                  token: btoa(
                    JSON.stringify({ email: request.email, otp: request.otp })
                  ),
                }
              )
          } catch (e) {
            if (e.response.data) {
              signinWithEmailOtpResponse = e.response.data
            } else {
              reject({ message: e.message, status: 'error' })
              return
            }
          }

          let signinWithEmailOtpResponseElement = signinWithEmailOtpResponse[0]
          if (
            signinWithEmailOtpResponseElement.ResponseType === 'client.notify'
          ) {
            reject({
              error: signinWithEmailOtpResponseElement.Attributes.message,
              status: 'error',
            })
            return
          }
          const newUserToken1 =
            signinWithEmailOtpResponseElement.Attributes.value
          const newUserObject1 = JSON.parse(atob(newUserToken1.split('.')[1]))
          const customer1 = signinWithEmailOtpResponse.filter(
            (e) => e.ResponseType === 'customer'
          )[0].Attributes[0]
          const credit1 = signinWithEmailOtpResponse.filter(
            (e) => e.ResponseType === 'credit'
          )[0].Attributes[0]
          const credits =
            signinWithEmailOtpResponse.filter(
              (e) => e?.ResponseType === 'client.notify'
            )?.[0]?.Attributes || {}

          const creatorProfile = await daptinClient.jsonApi.findAll('creator', {
            customer_id: customer1.reference_id,
            customerName: 'creator_id',
            included_relations: '',
          })

          daptinUserAuth = {
            token: newUserToken1,
            user: newUserObject1,
            credit: credit1,
            customer: customer1,
            creator: creatorProfile.data[0],
          }
          localStorage.setItem('DAPTIN', JSON.stringify(daptinUserAuth))
          localStorage.setItem('token', newUserToken1)
          // frontAgent.init()
          initializeDaptinClient()
          setTokenExpiryTimeout()
          // TODO: this decision has to be made in FE code
          // window.location = '/'

          resolve({
            data: { ...daptinUserAuth, credits },
            error: null,
            status: 'success',
          })
          break
        case 'signOut':
          localStorage.removeItem('DAPTIN')
          localStorage.removeItem('token')
          daptinUserAuth = {}
          resolve(null)
          break
        case 'signIn':
          try {
            const signinResponse1 = await daptinClient.actionManager.doAction(
              'user_account',
              'signin',
              {
                email: request.email,
                password: request.password,
              }
            )

            // Check for error notifications first
            const errorNotification = signinResponse1.find(
              (res) =>
                res.ResponseType === 'client.notify' &&
                res.Attributes.type === 'error'
            )

            if (errorNotification) {
              reject({
                message: errorNotification.Attributes.message,
                title: errorNotification.Attributes.title || 'Failed',
                type: 'error',
              })
              return
            }

            // If no errors, proceed with normal login flow
            const tokenResponse = signinResponse1.find(
              (res) =>
                res.ResponseType === 'client.store.set' &&
                res.Attributes['key'] === 'token'
            )

            if (!tokenResponse) {
              reject({
                message: 'No authentication token received',
                title: 'Failed',
                type: 'error',
              })
              return
            }

            var newUserToken2 = tokenResponse.Attributes['value']
            console.log(
              'Initiate email otp for ',
              request.email,
              signinResponse1
            )
            let signinResponseElement1 = signinResponse1[0]
            let newUserObject2 = JSON.parse(atob(newUserToken2.split('.')[1]))

            const customerResponse = signinResponse1.find(
              (e) => e.ResponseType === 'customer'
            )
            const creditResponse = signinResponse1.find(
              (e) => e.ResponseType === 'credit'
            )

            // if (!customerResponse || !creditResponse) {
            //     reject({
            //         message: 'Missing required user data in response',
            //         title: 'Failed',
            //         type: 'error'
            //     });
            //     return;
            // }

            let customer2 = customerResponse?.Attributes[0]
            let credit2 = creditResponse?.Attributes[0]

            daptinUserAuth = {
              token: newUserToken2,
              user: newUserObject2,
              credit: credit2,
              customer: customer2,
            }

            localStorage.setItem('DAPTIN', JSON.stringify(daptinUserAuth))
            localStorage.setItem('token', newUserToken2)
            initializeDaptinClient()
            resolve(signinResponseElement1)
          } catch (error) {
            console.error('Sign in error:', error)
            reject({
              message: error.message || 'An unexpected error occurred',
              title: 'Failed',
              type: 'error',
            })
          }
          break
        case 'createDocument':
          const newDocumentResponse = await daptinClient.jsonApi.create(
            'document',
            {
              document_name:
                'new document - ' + new Date().getTime() + '.crdt.json',
              document_extension: 'crdt',
              mime_type: 'x-crdt/yjs',
              document_path: '/' + 'workspaceName' + '/',
              document_content: [
                {
                  name: 'new document - ' + new Date().getTime() + '.json',
                  type: 'x-crdt/yjs',
                  path: '/' + 'workspaceName' + '/',
                  contents: 'data:workspace/' + 'crdt' + ',',
                },
              ],
            }
          )
          if (newDocumentResponse.errors && newDocumentResponse.errors.length) {
            reject(newDocumentResponse.errors[0])
            return
          }
          console.log('Created document ', newDocumentResponse)
          resolve(newDocumentResponse.data)

          break
        case 'getDocument':
          const documentResponse = await daptinClient.jsonApi.find(
            'document',
            request.reference_id,
            {
              included_relations: 'document_content,x-crdt/yjs',
            }
          )
          if (documentResponse.errors && documentResponse.errors.length) {
            reject(documentResponse.errors[0])
            return
          }
          console.log('Document ', documentResponse)
          resolve(documentResponse.data)

          break

        case 'signInWithEmail':
          const signinWithEmailResponse1 =
            await daptinClient.actionManager.doAction(
              'user_account',
              'signup',
              {
                email: request.email,
              }
            )
          console.log(
            'Initiate email otp for ',
            request.email,
            signinWithEmailResponse1
          )
          let signinWithEmailResponseElement1 = signinWithEmailResponse1[0]
          resolve(signinWithEmailResponseElement1)

          break

        case 'signInWithEmailWithReferral':
          const signinWithEmailResponse =
            await daptinClient.actionManager.doAction(
              'user_account',
              'signup',
              {
                email: request.email,
                password: request.password,
              }
            )
          resolve(signinWithEmailResponse)

          break
        case 'signUp':
          try {
            // Validate required parameters
            if (!request.email || !request.password || !request.name) {
              console.error('Missing required parameters for signup')
              reject({
                message:
                  'Missing required parameters: name, email, and password are required',
                type: 'error',
              })
              return
            }

            // Call the signup API
            const signupResponse = await daptinClient.actionManager.doAction(
              'user_account',
              'signup',
              {
                name: request.name,
                email: request.email,
                password: request.password,
                passwordConfirm: request.password,
              }
            )

            // Check for error notifications
            const errorNotification = signupResponse.find(
              (res) =>
                res.ResponseType === 'client.notify' &&
                res.Attributes.type === 'error'
            )

            if (errorNotification) {
              reject({
                message: errorNotification.Attributes.message,
                title: errorNotification.Attributes.title || 'Failed',
                type: 'error',
              })
              return
            }

            // If successful, resolve with the response
            resolve(signupResponse)
          } catch (error) {
            console.error('Signup error:', error)
            reject({
              message:
                error.message || 'An unexpected error occurred during signup',
              title: 'Failed',
              type: 'error',
            })
          }
          break
        default:
          break
      }
    } catch (e) {
      console.error('background error', e)
    }
  })
}

// Initialize function that can be awaited before app renders
export async function initializeDaptinClient() {
  try {
    console.log('Initializing daptinClient and loading models...')
    await daptinClient.reloadToken()
    console.log('Daptin client and models loaded successfully')
    return true
  } catch (error) {
    console.error('Failed to initialize daptinClient:', error)
    return false
  }
}
