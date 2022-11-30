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

New-Item -ItemType Directory `
    -Path "desktop_packaging/windows" `
    -Force

Export-PfxCertificate `
    -Cert "Cert:\CurrentUser\My\$($certificate.Thumbprint)" `
    -FilePath "desktop_packaging/windows/test_certificate.pfx" `
    -Password $password
