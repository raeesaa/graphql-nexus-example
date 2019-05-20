import { ApolloServer, gql } from 'apollo-server'
import { idArg, queryType, stringArg } from 'nexus'
import { makePrismaSchema, prismaObjectType } from 'nexus-prisma'
import * as path from 'path'
import datamodelInfo from './generated/nexus-prisma'
import { prisma, Employer, EmployerConnection } from './generated/prisma-client'

const Employee = prismaObjectType({
  name: 'Employee',
  description: 'Employee of a company(Employer)',
  definition: (t) => {
    t.prismaFields([
      '*', {
        name: 'employer',
        args: []
      }
    ])
  }
})

const Employer = prismaObjectType({
  name: 'Employer',
  description: 'Also known as a company that has employees',
  definition: (t) => {
    t.prismaFields([
      '*', {
        name: 'employees',
        args: []
      }
    ])
    t.int('num_employees', {
      description: 'Number of employees under an employer',
      resolve: async ({id}, args, context, info) => {
        let employeeConnection = await context.prisma.employeesConnection({where: {employer: {id}}})
        return employeeConnection.edges.length
      }
    })
  }
})

const Query = prismaObjectType({
  name: 'Query',
  definition: (t) => t.prismaFields(['*'])
})

const Mutation = prismaObjectType({
  name: 'Mutation',
  definition: (t) => t.prismaFields(['createEmployee', 'createEmployer'])
})

const schema = makePrismaSchema({
  // Provide all the GraphQL types we've implemented
  types: [Query, Mutation, Employee, Employer],

  // Configure the interface to Prisma
  prisma: {
    datamodelInfo,
    client: prisma,
  },

  // Specify where Nexus should put the generated files
  outputs: {
    schema: path.join(__dirname, './generated/schema.graphql'),
    typegen: path.join(__dirname, './generated/nexus.ts'),
  },

  // Configure nullability of input arguments: All arguments are non-nullable by default
  nonNullDefaults: {
    input: false,
    output: false,
  },

  // Configure automatic type resolution for the TS representations of the associated types
  typegenAutoConfig: {
    sources: [
      {
        source: path.join(__dirname, './types.ts'),
        alias: 'types',
      },
    ],
    contextType: 'types.Context',
  },
})

const server = new ApolloServer({
  schema,
  context: { prisma },
})

server.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000`),
)
