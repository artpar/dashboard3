import { faker } from '@faker-js/faker'

export const users = Array.from({ length: 20 }, () => {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  return {
    id: faker.string.uuid(),
    firstName,
    lastName,
    email: faker.internet.email({ firstName }).toLocaleLowerCase(),
    status: faker.helpers.arrayElement([
      'active',
      'inactive',
      'invited',
      'suspended',
    ]),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  }
})
