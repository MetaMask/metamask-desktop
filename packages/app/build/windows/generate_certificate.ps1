param (
    $dns='metamaskdesktoptest.com',
    $subject='MetaMask Desktop Test',
    $password='test123*'
)

$certificate = New-SelfSignedCertificate `
    -Type CodeSigning `
    -CertStoreLocation Cert:\CurrentUser\My `
    -DnsName $dns `
    -Subject $subject

$password = ConvertTo-SecureString `
    -String $password `
    -Force -AsPlainText

Export-PfxCertificate `
    -Cert "Cert:\CurrentUser\My\$($certificate.Thumbprint)" `
    -FilePath "build/windows/test_certificate.pfx" `
    -Password $password
