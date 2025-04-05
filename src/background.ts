import { daptinClient, reloadToken } from './daptin'
reloadToken();

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
  let delayTime = timeoutDuration / (1000 * 60)
  let resolution = 'minutes'
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

async function fetchAllWorksheets(taskId) {
  let allWorksheets = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const response = await daptinClient.jsonApi.findAll('worksheet', {
      rpatask_id: taskId,
      rpataskName: 'worksheet_id',
      'page[size]': '500',
      'page[number]': page,
      sort: 'created_at',
    })

    if (response.errors && response.errors.length) {
      throw response.errors[0]
    }

    allWorksheets = allWorksheets.concat(
      response.data.map((e) => JSON.parse(e.row_data))
    )
    hasMore = response.data.length === 500 // If less than 500, no more pages
    page++
  }

  return allWorksheets
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
                'signin_100xbot_email',
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
          let newUserObject1 = JSON.parse(atob(newUserToken1.split('.')[1]))
          let customer1 = signinWithEmailOtpResponse.filter(
            (e) => e.ResponseType === 'customer'
          )[0].Attributes[0]
          let credit1 = signinWithEmailOtpResponse.filter(
            (e) => e.ResponseType === 'credit'
          )[0].Attributes[0]
          let credits =
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
              'signin_100xbot',
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
        case 'createWaitlistEntry':
          const waitlistResponse = await daptinClient.jsonApi.create(
            'waitlist',
            {
              email: request.payload.email,
              name: request.payload.name,
              industry: request.payload.industry,
            }
          )
          if (waitlistResponse.errors && waitlistResponse.errors.length) {
            reject(waitlistResponse.errors[0])
            return
          }
          console.log('Added to waitlist', waitlistResponse)
          resolve(waitlistResponse.data)
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
        case 'getAllMemories':
          const memoryListResponse = await daptinClient.jsonApi.findAll(
            'memory',
            {
              sort: 'display_order',
            }
          )
          if (memoryListResponse.errors && memoryListResponse.errors.length) {
            reject(memoryListResponse.errors[0])
            return
          }
          console.log('Memory list ', memoryListResponse)
          resolve(memoryListResponse.data)

          break
        case 'getAllMemoriesByQuery':
          let allMemoriesByQuery = await daptinClient.jsonApi.findAll(
            'memory',
            {
              'page[size]': 50,
              query: JSON.stringify([
                {
                  column: 'title', // is a boolean column
                  operator: 'ilike', // case insensitive like query
                  value: '%' + request.query + '%', // true not "true"
                },
                {
                  column: 'show_on_sidepanel', // is a boolean column
                  operator: 'eq', // case insensitive like query
                  value: '1', // true not "true"
                },
              ]),
              sort: 'display_order',
              included_relations: 'creator_id,workgroup_id',
            }
          )
          resolve(allMemoriesByQuery.data)
          break
        case 'getMemory':
          const memoryResponse = await daptinClient.jsonApi.findAll(
            'memory',
            {}
          )
          if (memoryResponse.errors && memoryResponse.errors.length) {
            reject(memoryResponse.errors[0])
            return
          }
          console.log('Memory ', memoryResponse)
          resolve(memoryResponse.data)

          break
        case 'getMemoryById':
          const memoryOneResponse = await daptinClient.jsonApi.find(
            'memory',
            request.reference_id,
            {
              included_relations: 'creator_id,article_id,workgroup_id',
            }
          )
          if (memoryOneResponse.errors && memoryOneResponse.errors.length) {
            reject(memoryOneResponse.errors[0])
            return
          }
          console.log('Memory ', memoryOneResponse)
          resolve(memoryOneResponse.data)

          break
        case 'getMemoryByCreatorId':
          const memoryCreatorResponse = await daptinClient.jsonApi.findAll(
            'memory',
            {
              creator_id: request.reference_id,
              creatorName: 'memory_id',
              query: JSON.stringify([
                {
                  column: 'show_on_sidepanel',
                  operator: 'eq',
                  value: '1',
                },
              ]),
              included_relations: 'article_id',
            }
          )
          if (
            memoryCreatorResponse.errors &&
            memoryCreatorResponse.errors.length
          ) {
            reject(memoryCreatorResponse.errors[0])
            return
          }
          resolve(memoryCreatorResponse?.data)
          break
        case 'create_reply':
          try {
            // Extract parameters from the request
            const { content, parent_type, parent_id } = request

            // Validate required fields
            if (!content || !parent_type || !parent_id) {
              console.error('Missing required fields for reply creation')
              reject({
                error:
                  'Missing required fields: content, parent_type, and parent_id are required',
              })
              return
            }

            // Check if parent_type is valid
            if (!['memory', 'article', 'reply'].includes(parent_type)) {
              console.error('Invalid parent_type for reply creation')
              reject({
                error:
                  'Invalid parent_type. Must be one of: memory, article, reply',
              })
              return
            }

            // Create the reply using the appropriate action
            const replyResponse = await daptinClient.actionManager.doAction(
              'reply',
              'create_reply',
              {
                content: content,
                parent_type: parent_type,
                parent_id: parent_id,
              }
            )

            // Check for notification responses
            const notificationResponse = replyResponse.find(
              (res) => res.ResponseType === 'client.notify'
            )
            if (notificationResponse) {
              alert(notificationResponse.Attributes.message)
              return
            }

            // Extract the created reply from the response
            const createdReply = replyResponse.find(
              (res) => res.ResponseType === 'reply'
            )?.Attributes

            console.log('Reply created successfully:', createdReply)
            resolve({ success: true, reply: createdReply })
          } catch (error) {
            console.error('Error creating reply:', error)
            reject({ error: 'Failed to create reply: ' + error.message })
          }
          break

        case 'getReviewsByMemoryId':
          const reviewResponse = await daptinClient.jsonApi.findAll('review', {
            memory_id: request.reference_id,
            memoryName: 'review_id',
            included_relations: 'customer_id',
          })
          if (reviewResponse.errors && reviewResponse.errors.length) {
            reject(reviewResponse.errors[0])
            return
          }
          resolve(reviewResponse?.data)
          break
        case 'getCreatorBySlug':
          const creatorSlugResponse = await daptinClient.jsonApi.findAll(
            'creator',
            {
              query: JSON.stringify([
                {
                  column: 'creator_slug',
                  operator: 'eq',
                  value: request.slug,
                },
              ]),
            }
          )
          if (creatorSlugResponse.errors && creatorSlugResponse.errors.length) {
            reject(creatorSlugResponse.errors[0])
            return
          }

          resolve(creatorSlugResponse?.data?.[0])
          break
        case 'getCreatorInfoById':
          const creatorResponse = await daptinClient.jsonApi.find(
            'creator',
            request.reference_id,
            {
              included_relations: 'article_id',
            }
          )
          if (creatorResponse.errors && creatorResponse.errors.length) {
            reject(creatorResponse.errors[0])
            return
          }
          console.log('creatorResponse ', creatorResponse)
          resolve(creatorResponse.data)
          break
        case 'getCreatorInfoByCustomerId':
          const getCreatorByCustomerId = await daptinClient.jsonApi.findAll(
            'creator',
            {
              customer_id: request.reference_id,
              customerName: 'creator_id',
              included_relations: 'creator_image',
            }
          )
          if (
            getCreatorByCustomerId.errors &&
            getCreatorByCustomerId.errors.length
          ) {
            reject(getCreatorByCustomerId.errors[0])
            return
          }
          console.log('creatorResponse ', getCreatorByCustomerId)
          resolve(getCreatorByCustomerId.data[0])
          break
        case 'updateCreatorInfo':
          const updatedCreatorInfo = await daptinClient.actionManager.doAction(
            'customer',
            'update_creator',
            request.payload
          )
          console.log('updatedCreatorInfo response', updatedCreatorInfo)
          if (updatedCreatorInfo.errors && updatedCreatorInfo.errors.length) {
            reject(updatedCreatorInfo.errors[0])
            return
          }
          console.log('updateCreatorInfoResponse ', updatedCreatorInfo)
          daptinUserAuth.creator = updatedCreatorInfo[0].Attributes
          localStorage.setItem('DAPTIN', JSON.stringify(daptinUserAuth))
          resolve(updatedCreatorInfo[updatedCreatorInfo.length - 1].Attributes)
          break
        case 'addCreatorProfile':
          const addedCreatorInfo = await daptinClient.actionManager.doAction(
            'customer',
            'addCreator',
            request.payload
          )
          console.log('updatedCreatorInfo response', addedCreatorInfo)
          if (addedCreatorInfo.errors && addedCreatorInfo.errors.length) {
            reject(addedCreatorInfo.errors[0])
            return
          }
          console.log('addedCreatorInfoResponse ', addedCreatorInfo)
          daptinUserAuth.creator = addedCreatorInfo[0].Attributes
          localStorage.setItem('DAPTIN', JSON.stringify(daptinUserAuth))
          resolve(
            addedCreatorInfo.filter((e) => e.ResponseType === 'creator')[0]
              .Attributes
          )
          break
        case 'updateCustomerInfo':
          const updatedCustomerInfo = await daptinClient.actionManager.doAction(
            'customer',
            'update_customer',
            request.payload
          )
          console.log('updatedCustomerInfo response', updatedCustomerInfo)
          if (updatedCustomerInfo.errors && updatedCustomerInfo.errors.length) {
            reject(updatedCustomerInfo.errors[0])
            return
          }
          console.log('updateCreatorInfoResponse ', updatedCustomerInfo)
          daptinUserAuth.customer = updatedCustomerInfo[0].Attributes
          localStorage.setItem('DAPTIN', JSON.stringify(daptinUserAuth))
          resolve(
            updatedCustomerInfo[updatedCustomerInfo.length - 1].Attributes
          )
          break
        case 'getArticlesByCreatorId':
          const getArticlesByCreatorId = await daptinClient.jsonApi.findAll(
            'article',
            {
              creator_id: request.reference_id,
              creatorName: 'article_id',
            }
          )
          if (
            getArticlesByCreatorId.errors &&
            getArticlesByCreatorId.errors.length
          ) {
            reject(getArticlesByCreatorId.errors[0])
            return
          }
          console.log('getArticlesByCreatorIdResponse ', getArticlesByCreatorId)
          resolve(getArticlesByCreatorId.data)
          break
        case 'getArticlesByWorkgroupId':
          const creatorArticleResponse = await daptinClient.jsonApi.findAll(
            'article',
            {
              workgroup_id: request.reference_id,
              workgroupName: 'article_id',
            }
          )
          if (
            creatorArticleResponse.errors &&
            creatorArticleResponse.errors.length
          ) {
            reject(creatorArticleResponse.errors[0])
            return
          }
          console.log('creatorResponse ', creatorArticleResponse)
          resolve(creatorArticleResponse.data)
          break
        case 'getMemoryByTitle':
          console.log('getMemoryByTitle: ', request.title)
          const taskByMemory = await daptinClient.jsonApi.findAll('memory', {
            query: JSON.stringify([
              {
                column: 'title',
                operator: 'eq',
                value: request.title,
              },
            ]),
            included_relations: 'creator_id,article_id,workgroup_id',
          })

          console.log({ taskByMemory })

          resolve(taskByMemory?.data[0])
          break
        case 'getMemoryByQuery':
          console.log('getMemoryByQuery: ', request.query)
          const taskByQuery = await daptinClient.jsonApi.findAll('memory', {
            query: JSON.stringify([
              {
                column: 'title',
                operator: 'iLike',
                value: request.query,
              },
            ]),
            included_relations: 'creator_id,article_id,workgroup_id',
          })

          console.log({ taskByQuery })

          resolve(taskByQuery?.data)
          break
        case 'getTask':
          const taskResponse = await daptinClient.jsonApi.find(
            'rpatask',
            request.reference_id
          )
          if (taskResponse.errors && taskResponse.errors.length) {
            reject(taskResponse.errors[0])
            return
          }
          console.log('Rpa task ', taskResponse)
          resolve(taskResponse.data)

          break
        case 'getTaskWorksheet':
          const taskWorksheetResponse = await daptinClient.jsonApi.findAll(
            'worksheet',
            {
              rpatask_id: request.task_id,
              rpataskName: 'worksheet_id',
              'page[size]': '500',
              sort: 'created_at',
            }
          )
          if (
            taskWorksheetResponse.errors &&
            taskWorksheetResponse.errors.length
          ) {
            reject(taskWorksheetResponse.errors[0])
            return
          }
          console.log('Rpa task worksheet', taskWorksheetResponse)
          resolve(taskWorksheetResponse.data)

          break
        case 'downloadWorksheet':
          exportToXLSX(request.task_id)
            .then(() => resolve())
            .catch(reject)
          break

        case 'getWorkgroups':
          let workgroups = await daptinClient.jsonApi.findAll('workgroup', {
            'page[size]': 100,
            query: JSON.stringify([
              {
                column: 'show_on_sidepanel',
                operator: 'eq',
                value: '1',
              },
            ]),
          })

          resolve({
            data: workgroups.data,
          })
          break
        case 'getWorkgroupByName':
          let workgroupByName = await daptinClient.jsonApi.findAll(
            'workgroup',
            {
              'page[size]': 100,
              query: JSON.stringify([
                {
                  column: 'name',
                  operator: 'ilike',
                  value: request.name,
                },
                {
                  column: 'show_on_sidepanel',
                  operator: 'eq',
                  value: '1',
                },
              ]),
            }
          )

          resolve(workgroupByName.data[0])
          break
        case 'getWorkgroupByQuery':
          let workgroupByQuery = await daptinClient.jsonApi.findAll(
            'workgroup',
            {
              'page[size]': 100,
              query: JSON.stringify([
                {
                  column: 'name',
                  operator: 'ilike',
                  value: '%' + request.query + '%',
                },
                {
                  column: 'show_on_sidepanel',
                  operator: 'eq',
                  value: '1',
                },
              ]),
            }
          )

          resolve(workgroupByQuery.data)
          break
        case 'getWorkgroupsByType':
          let workgroupByType = await daptinClient.jsonApi.findAll(
            'workgroup',
            {
              'page[size]': request.limit,
              query: JSON.stringify([
                {
                  column: 'group_type',
                  operator: 'eq',
                  value: request.groupType,
                },
                {
                  column: 'show_on_sidepanel',
                  operator: 'eq',
                  value: '1',
                },
              ]),
            }
          )

          resolve(workgroupByType.data)
          break
        case 'getUserWorkgroups':
          let userWorkgroups = await daptinClient.jsonApi.findAll(
            'workgroup',
            {}
          )

          resolve(userWorkgroups.data)
          break
        case 'removeFavouriteMemory':
          let removeFavouriteMemoryResponse = await daptinClient.jsonApi
            .one('memory', request.memory_id)
            .relationships('favourites_for')
            .destroy([{ id: daptinUserAuth?.customer.reference_id }])
          resolve(true)
          break
        // case 'checkFavouriteMemory':
        //     resolve({
        //         isFavourite: true
        //     })
        //     break

        case 'checkFavouriteMemory':
          if (!daptinUserAuth || !daptinUserAuth.customer) {
            resolve({
              data: [],
            })
            return
          }
          let allFavourites = await daptinClient.jsonApi
            .one('customer', daptinUserAuth.customer.reference_id)
            .all('favourites_of')
            .get({
              fields: 'reference_id',
            })

          const isFavourite =
            allFavourites.data.filter((m) => m.id === request.memory_id)
              .length > 0
          resolve({
            isFavourite: isFavourite,
          })
          break

        case 'addFavouriteMemory':
          let addFavouriteMemoryResponse = await daptinClient.jsonApi
            .one('memory', request.memory_id)
            .relationships('favourites_for')
            .patch([{ id: daptinUserAuth?.customer.reference_id }])
          resolve(true)
          break

        case 'getCustomerFavourites':
          if (!daptinUserAuth || !daptinUserAuth.customer) {
            resolve({
              data: [],
            })
            return
          }
          let favouritesResponse = await daptinClient.jsonApi
            .one('customer', daptinUserAuth.customer.reference_id)
            .all('favourites_of')
            .get()
          resolve({
            data: favouritesResponse.data,
          })
          break
        case 'getMemoriesForWorkgroup':
          let memoryFromWg = await daptinClient.jsonApi
            .one('workgroup', request.reference_id)
            .all('memory_id')
            .get({
              query: request.title
                ? JSON.stringify([
                    {
                      column: 'title',
                      operator: 'iLike',
                      value: request.title,
                    },
                    {
                      column: 'show_on_sidepanel',
                      operator: 'eq',
                      value: '1',
                    },
                  ])
                : JSON.stringify([
                    {
                      column: 'show_on_sidepanel',
                      operator: 'eq',
                      value: '1',
                    },
                  ]),
              included_relations: 'article_id,workgroup_id,creator_id',
            })
          console.log('[MEM] Response : ', memoryFromWg)
          resolve(memoryFromWg.data)
          break
        case 'getMemories':
          let allMemories = await daptinClient.jsonApi.findAll('memory', {
            query: request.title
              ? JSON.stringify([
                  {
                    column: 'title',
                    operator: 'iLike',
                    value: request.title,
                  },
                  {
                    column: 'show_on_sidepanel',
                    operator: 'eq',
                    value: '1',
                  },
                ])
              : JSON.stringify([
                  {
                    column: 'show_on_sidepanel',
                    operator: 'eq',
                    value: '1',
                  },
                ]),
            included_relations: 'article_id,workgroup_id,creator_id',
          })
          console.log('[MEM] Response : ', allMemories)
          resolve(allMemories.data)
          break
        case 'getArticleBySlug':
          const memoryArticle = await daptinClient.jsonApi.findAll('article', {
            query: JSON.stringify([
              {
                column: 'slug',
                operator: 'eq',
                value: request.slug,
              },
            ]),
            included_relations: 'creator_id',
          })
          resolve({
            data: memoryArticle?.data?.[0] || {},
          })
          break
        case 'getFeaturedArticle':
          const featuredArticle = await daptinClient.jsonApi.findAll(
            'article',
            {
              sort: '-created_at',
              included_relations: 'creator_id,workgroup_id',
            }
          )
          resolve({
            data: featuredArticle?.data || {},
          })
          break

        case 'sendInviteToEmails':
          const response = await daptinClient.actionManager.doAction(
            'user_account',
            'send_custom_invite_email',
            {
              emails: request.emails,
              referral_code: request.referral_code,
            }
          )

          const inviteStatus =
            response.find((e) => e.ResponseType === 'client.notify')?.Attributes
              ?.emailStatus || 'Sorry, Could not send the invites!'

          if (inviteStatus === 'messages sent') {
            resolve({
              success: true,
              error: null,
            })
          } else {
            resolve({
              success: false,
              error: inviteStatus,
            })
          }

          break
        case 'getAllTask':
          const taskListResponse = await daptinClient.jsonApi.findAll(
            'rpatask',
            {
              sort: '-created_at',
              query: JSON.stringify([
                {
                  column: 'root_rpatask',
                  operator: 'is null',
                  value: 'null',
                },
              ]),
            }
          )
          if (taskListResponse.errors && taskListResponse.errors.length) {
            reject(taskListResponse.errors[0])
            return
          }
          console.log('Rpa task list', taskListResponse)
          resolve(
            taskListResponse.data.filter(
              (e) => e.prompt.indexOf('Always running task') === -1
            )
          )

          break
        case 'getStep':
          const stepResponse = await daptinClient.jsonApi.find(
            'rpastep',
            request.reference_id
          )
          if (stepResponse.errors && stepResponse.errors.length) {
            reject(stepResponse.errors[0])
            return
          }
          console.log('Rpa step ', stepResponse)
          resolve(stepResponse.data)

          break
        case 'getStepByTaskId':
          const stepListResponse = await daptinClient.jsonApi.findAll(
            'rpastep',
            {
              rpatask_id: request.task_id,
              rpataskName: 'rpastep_id',
            }
          )
          if (stepListResponse.errors && stepListResponse.errors.length) {
            reject(stepListResponse.errors[0])
            return
          }
          console.log('Rpa step list by task id ', stepListResponse)
          resolve(stepListResponse.data)

          break
        case 'updateDocument':
          const uDocumentResponse = await daptinClient.jsonApi.update(
            'document',
            {
              ...request.document,
            }
          )
          if (uDocumentResponse.errors && uDocumentResponse.errors.length) {
            reject(uDocumentResponse.errors[0])
            return
          }
          console.log('Document ', uDocumentResponse)
          resolve(uDocumentResponse.data)

          break

        case 'signInWithEmail':
          const signinWithEmailResponse1 =
            await daptinClient.actionManager.doAction(
              'user_account',
              'signup_100xbot_email',
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
              'signup_100xbot_email_referral',
              {
                email: request.email,
                referral_code: request.referral_code,
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
                message: 'Missing required parameters: name, email, and password are required',
                type: 'error'
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
              message: error.message || 'An unexpected error occurred during signup',
              title: 'Failed',
              type: 'error',
            })
          }
          break
        case 'getMemoryReplies':
          try {
            // Validate required parameters
            if (!request.memory_id) {
              console.error('Missing memory_id for getMemoryReplies')
              reject({ error: 'Missing memory_id parameter' })
              return
            }

            // Query through the memory_reply table to get replies for this memory
            const memoryRepliesResponse = await daptinClient.jsonApi
              .one('memory', request.memory_id)
              .all('memory_reply_id')
              .get({
                sort: '-created_at',
                included_relations: 'customer_id,reply_id',
                'page[size]': request.limit || 50,
              })

            if (
              memoryRepliesResponse.errors &&
              memoryRepliesResponse.errors.length
            ) {
              reject(memoryRepliesResponse.errors[0])
              return
            }

            console.log('Memory replies: ', memoryRepliesResponse)
            resolve(memoryRepliesResponse.data)
          } catch (error) {
            console.error('Error fetching memory replies:', error)
            reject({
              error: 'Failed to fetch memory replies: ' + error.message,
            })
          }
          break
        case 'create_upvote':
          try {
            // Extract parameters from the request
            const { vote_type, parent_type, parent_id } = request

            // Validate required fields
            if (!vote_type || !parent_type || !parent_id) {
              console.error('Missing required fields for upvote creation')
              reject({
                error:
                  'Missing required fields: vote_type, parent_type, and parent_id are required',
              })
              return
            }

            // Check if parent_type is valid
            if (!['memory', 'article', 'reply'].includes(parent_type)) {
              console.error('Invalid parent_type for upvote creation')
              reject({
                error:
                  'Invalid parent_type. Must be one of: memory, article, reply',
              })
              return
            }

            // Check if vote_type is valid
            if (!['upvote', 'downvote'].includes(vote_type)) {
              console.error('Invalid vote_type for vote creation')
              reject({
                error: 'Invalid vote_type. Must be one of: upvote, downvote',
              })
              return
            }

            // Create the upvote using the appropriate action
            const upvoteResponse = await daptinClient.actionManager.doAction(
              'upvote',
              'create_upvote',
              {
                vote_type: vote_type,
                parent_type: parent_type,
                parent_id: parent_id,
              }
            )

            // Check for notification responses
            const notificationResponse = upvoteResponse.find(
              (res) => res.ResponseType === 'client.notify'
            )
            if (notificationResponse) {
              resolve({
                success: true,
                message: notificationResponse.Attributes.message,
                action: notificationResponse.Attributes.action || 'created',
              })
              return
            }

            // Extract the created upvote from the response
            const createdUpvote = upvoteResponse.find(
              (res) => res.ResponseType === 'upvote'
            )?.Attributes

            console.log('Vote created successfully:', createdUpvote)
            resolve({ success: true, upvote: createdUpvote })
          } catch (error) {
            console.error('Error creating vote:', error)
            reject({ error: 'Failed to create vote: ' + error.message })
          }
          break

        case 'check_user_vote':
          try {
            // Extract parameters from the request
            const { parent_type, parent_id } = request

            // Validate required fields
            if (!parent_type || !parent_id) {
              console.error('Missing required fields for checking user vote')
              reject({
                error:
                  'Missing required fields: parent_type and parent_id are required',
              })
              return
            }

            // Check if user is authenticated
            if (!daptinUserAuth || !daptinUserAuth.customer) {
              resolve({ has_voted: false, vote_type: null })
              return
            }

            // Check the user vote using the appropriate action
            const checkVoteResponse = await daptinClient.actionManager.doAction(
              'upvote',
              'check_user_vote',
              {
                parent_type: parent_type,
                parent_id: parent_id,
              }
            )

            // Extract the vote information from the response
            const voteInfo = checkVoteResponse.find(
              (res) => res.ResponseType === 'client.notify'
            )?.Attributes

            if (!voteInfo) {
              resolve({ has_voted: false, vote_type: null })
              return
            }

            resolve({
              has_voted: voteInfo.has_voted,
              vote_type: voteInfo.vote_type,
            })
          } catch (error) {
            console.error('Error checking user vote:', error)
            reject({ error: 'Failed to check user vote: ' + error.message })
          }
          break

        case 'get_vote_count':
          try {
            // Extract parameters from the request
            const { parent_type, parent_id } = request

            // Validate required fields
            if (!parent_type || !parent_id) {
              console.error('Missing required fields for getting vote count')
              reject({
                error:
                  'Missing required fields: parent_type and parent_id are required',
              })
              return
            }

            // Get the vote count using the appropriate action
            const voteCountResponse = await daptinClient.actionManager.doAction(
              'upvote',
              'get_vote_count',
              {
                parent_type: parent_type,
                parent_id: parent_id,
              }
            )

            // Extract the vote count information from the response
            const voteCountInfo = voteCountResponse.find(
              (res) => res.ResponseType === 'client.notify'
            )?.Attributes

            if (!voteCountInfo) {
              resolve({ upvote_count: 0, downvote_count: 0, total_votes: 0 })
              return
            }

            resolve({
              upvote_count: voteCountInfo.upvote_count,
              downvote_count: voteCountInfo.downvote_count,
              total_votes: voteCountInfo.total_votes,
            })
          } catch (error) {
            console.error('Error getting vote count:', error)
            reject({ error: 'Failed to get vote count: ' + error.message })
          }
          break

        case 'getArticleReplies':
          try {
            // Validate required parameters
            if (!request.article_id) {
              console.error('Missing article_id for getArticleReplies')
              reject({ error: 'Missing article_id parameter' })
              return
            }

            // Query through the article_reply table to get replies for this article
            const articleRepliesResponse = await daptinClient.jsonApi
              .one('article', request.article_id)
              .all('article_reply_id')
              .get({
                sort: '-created_at',
                included_relations: 'customer_id,reply_id',
                'page[size]': request.limit || 50,
              })

            if (
              articleRepliesResponse.errors &&
              articleRepliesResponse.errors.length
            ) {
              reject(articleRepliesResponse.errors[0])
              return
            }

            console.log('Article replies: ', articleRepliesResponse)
            resolve(articleRepliesResponse.data)
          } catch (error) {
            console.error('Error fetching article replies:', error)
            reject({
              error: 'Failed to fetch article replies: ' + error.message,
            })
          }
          break
        case 'getReplyReplies':
          try {
            // Validate required parameters
            if (!request.reply_id) {
              console.error('Missing reply_id for getReplyReplies')
              reject({ error: 'Missing reply_id parameter' })
              return
            }

            // Query through the parent_reply relationship to get child replies
            const replyRepliesResponse = await daptinClient.jsonApi
              .one('reply', request.reply_id)
              .all('child_reply_id')
              .get({
                sort: '-created_at',
                included_relations:
                  'customer_id,reply_id,child_reply_id,parent_reply_id',
                'page[size]': request.limit || 50,
              })

            if (
              replyRepliesResponse.errors &&
              replyRepliesResponse.errors.length
            ) {
              reject(replyRepliesResponse.errors[0])
              return
            }

            console.log('Reply replies: ', replyRepliesResponse)
            resolve(replyRepliesResponse.data)
          } catch (error) {
            console.error('Error fetching reply replies:', error)
            reject({ error: 'Failed to fetch reply replies: ' + error.message })
          }
          break
        case 'deleteArticle':
          try {
            // Use the delete_article action on article entity
            const deleteArticleResponse =
              await daptinClient.actionManager.doAction(
                'article',
                'delete_article',
                {
                  article_id: request.articleId,
                }
              )

            // Check for success notification
            const successResponse = deleteArticleResponse.find(
              (res) =>
                res.ResponseType === 'client.notify' &&
                res.Attributes.status === 'success'
            )

            if (!successResponse) {
              // Check for error notification
              const errorResponse = deleteArticleResponse.find(
                (res) =>
                  res.ResponseType === 'client.notify' &&
                  res.Attributes.status === 'error'
              )

              if (errorResponse) {
                reject(new Error(errorResponse.Attributes.message))
                return
              }

              reject(new Error('Failed to delete article'))
              return
            }

            resolve({
              success: true,
              message: successResponse.Attributes.message,
            })
          } catch (error) {
            console.error('Error deleting article:', error)
            reject(error)
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
