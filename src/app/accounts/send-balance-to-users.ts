import { getRecentlyActiveAccounts } from "@app/accounts/active-accounts"
import { getCurrentPrice } from "@app/prices"
import { Wallets } from "@app"
import { NotificationsService } from "@services/notifications"

export const sendBalanceToAccounts = async (logger: Logger) => {
  const accounts = await getRecentlyActiveAccounts()
  if (accounts instanceof Error) throw accounts

  const price = await getCurrentPrice()

  for (const account of accounts) {
    const balance = await Wallets.getBalanceForWallet({
      walletId: account.defaultWalletId,
      logger,
    })
    if (balance instanceof Error) throw balance

    await NotificationsService(logger).sendBalance({
      balance,
      ownerId: account.ownerId,
      price,
    })
  }
}
