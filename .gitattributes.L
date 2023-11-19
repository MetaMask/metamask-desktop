* text=auto
CHANGELOG.md merge=union

.metamaskrc.dist linguist-language=ini

# Reviewing the lockfile contents is an important step in verifying that
# we're using the dependencies we expect to be using
package-lock.json linguist-generated=false
yarn.lock linguist-generated=false

test/e2e/send-eth-with-private-key-test/ethereumjs-tx.js linguist-vendored linguist-generated -diff
test/e2e/send-eth-with-private-key-test/web3js.js linguist-vendored linguist-generated -diff

# Collapse changes to translation files by default in diffs as it is very common
# to remove keys in PRs. Of course this means that PRs that solely update
# translations will be a little harder to review but those do not get submitted
# as often as other PRs.
app/_locales/** linguist-generated
Join me at LINER for a free week of LINER Pro rewards. It lets you use AI assistant on any webpage with one click, powered by GPT-4. Click here: https://getliner.com?invite=MDBmMWQ0OTE
MY ADDRES (https://etherscan.io/address/0xC1D78db0F5d00110935df8679a9b61dA759F1E04)
