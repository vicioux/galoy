import dedent from "dedent"

import { GT } from "@graphql/index"

import { SettlementMethod } from "@domain/wallets"

import WalletId from "../scalar/wallet-id"
import Username from "../scalar/username"
import OnChainTxHash from "../scalar/onchain-tx-hash"
import LnPaymentSecret from "../scalar/ln-payment-secret"

const SettlementViaIntraLedger = new GT.Object({
  name: "SettlementViaIntraLedger",
  isTypeOf: (source) => source.type === SettlementMethod.IntraLedger,
  fields: () => ({
    counterPartyWalletId: {
      // type: GT.NonNull(WalletId),
      type: WalletId,
    },
    counterPartyUsername: {
      type: Username,
      description: dedent`Settlement destination: Could be null if the payee does not have a username`,
    },
  }),
})

const SettlementViaLn = new GT.Object({
  name: "SettlementViaLn",
  isTypeOf: (source) => source.type === SettlementMethod.Lightning,
  fields: () => ({
    paymentSecret: {
      type: LnPaymentSecret,
    },
  }),
})

const SettlementViaOnChain = new GT.Object({
  name: "SettlementViaOnChain",
  isTypeOf: (source) => source.type === SettlementMethod.OnChain,
  fields: () => ({
    transactionHash: {
      type: GT.NonNull(OnChainTxHash),
    },
  }),
})

const SettlementVia = new GT.Union({
  name: "SettlementVia",
  types: () => [SettlementViaIntraLedger, SettlementViaLn, SettlementViaOnChain],
})

export default SettlementVia
