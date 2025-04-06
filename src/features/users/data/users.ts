import { faker } from '@faker-js/faker'

export const users = Array.from({ length: 20 }, () => {
  const name = faker.person.fullName()
  const firstName = faker.person.firstName()
  const lastName = faker.person.firstName()
  return {
    id: faker.string.uuid(),
    name: name,
    email: faker.internet.email({ firstName: firstName, lastName: lastName }).toLocaleLowerCase(),
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
