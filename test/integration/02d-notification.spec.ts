/**
 * @jest-environment node
 */

import { getCurrentPrice } from "src/realtimePrice"
import { sendBalanceToUsers } from "src/entrypoint/dailyBalanceNotification"
import { customerPath } from "src/ledger/ledger"
import { MainBook, setupMongoConnection } from "src/mongodb"
import { Transaction, User } from "src/schema"
import { baseLogger } from "src/logger"
import { getFunderWallet } from "src/walletFactory"
import { getUserWallet } from "./helper"
jest.mock("src/notifications/notification")
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendNotification } = require("src/notifications/notification")

jest.mock("src/realtimePrice", () => require("../mocks/realtimePrice"))

let price

beforeAll(async () => {
  await setupMongoConnection()
  price = await getCurrentPrice()
})

afterAll(async () => {
  jest.restoreAllMocks()
})

it("sends daily balance notification", async () => {
  await sendBalanceToUsers()
  const numActiveUsers = (await User.getActiveUsers()).length
  expect(sendNotification.mock.calls.length).toBe(numActiveUsers)
  for (const [call] of sendNotification.mock.calls) {
    const { balance } = await MainBook.balance({ accounts: customerPath(call.user._id) })
    const expectedUsdBalance = (price * balance).toLocaleString("en", {
      maximumFractionDigits: 2,
    })
    const expectedSatsBalance = balance.toLocaleString("en", { maximumFractionDigits: 2 })
    expect(call.title).toBe(
      `Your balance is $${expectedUsdBalance} (${expectedSatsBalance} sats)`,
    )
  }
})

// FIXME make this test re-entrant
it("tests isUserActive", async () => {
  await getUserWallet(8)

  const activeUsers = await User.getActiveUsers()

  const initialActiveUsersAccountPath = activeUsers.map((user) => customerPath(user._id))
  const userWallet0AccountPath = (await getUserWallet(0)).user.accountPath
  const funderWalletAccountPath = (await getFunderWallet({ logger: baseLogger })).user
    .accountPath

  // user0, user2, user11, user12 and funder wallet are active users
  expect(initialActiveUsersAccountPath.length).toBe(5)
  expect(initialActiveUsersAccountPath.indexOf(userWallet0AccountPath)).toBeGreaterThan(
    -1,
  )
  expect(initialActiveUsersAccountPath.indexOf(funderWalletAccountPath)).toBeGreaterThan(
    -1,
  )

  for (const activeUserAccountPath of initialActiveUsersAccountPath) {
    await Transaction.updateMany(
      { accounts: activeUserAccountPath },
      { $set: { timestamp: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) } },
    )
  }
  const finalNumActiveUsers = (await User.getActiveUsers()).length
  expect(finalNumActiveUsers).toBe(0)
})