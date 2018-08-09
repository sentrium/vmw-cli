# vmw-cli

#### Configure authentication for my.vmware.com
```
export VMWUSER=<username>
export VMWPASS=<password>
```

## Install
`vmw-cli` can be installed natively via NPM or consumed using a pre-built docker image.
Files will be downloaded to current directory.

#### via NPM
After install - tool can be leveraged directly via `vmw-cli` command
```
npm install --global vmw-cli
```

#### via Docker
Examples listed below would require this `docker run` command in front
```
docker run -it -e VMWUSER -e VMWPASS -v ${PWD}:/files apnex/vmw-cli
```

## Examples
#### vmw-cli find lcp
```
$ vmw-cli find lcp

Index [allGroups.json] found - local load...
solution                          productGroup   productType       version  fileName                                              fileDate    fileSize   fileType  
--------------------------------  -------------  ----------------  -------  ----------------------------------------------------  ----------  ---------  --------  
vmware-pivotal-container-service  NSX-T-210      Product Binaries  2.1.0    nsx-lcp-2.1.0.0.0.7395497-esx65.zip                   2017-12-21  23.02 MB   zip       
vmware-pivotal-container-service  NSX-T-210      Product Binaries  2.1.0    nsx-lcp-2.1.0.0.0.7395497-ubuntu-xenial_amd64.tar.gz  2017-12-21  45.27 MB   gz        
vmware-pivotal-container-service  NSX-T-210      Product Binaries  2.1.0    nsx-lcp-2.1.0.0.0.7395497-rhel74_x86_64.tar.gz        2017-12-21  54.52 MB   gz        
vmware-pivotal-container-service  NSX-T-210      Product Binaries  2.1.0    nsx-lcp-2.1.0.0.0.7395497-rhel73_x86_64.tar.gz        2017-12-21  54.46 MB   gz        
vmware-nsx-t-data-center          NSX-T-220      Product Binaries  2.2.0    nsx-lcp-2.2.0.0.0.8680789-esx65.zip                   2018-06-05  26.87 MB   zip       
vmware-nsx-t-data-center          NSX-T-220      Product Binaries  2.2.0    nsx-lcp-2.2.0.0.0.8680789-esx67.zip                   2018-06-05  25.88 MB   zip       
vmware-nsx-t-data-center          NSX-T-220      Product Binaries  2.2.0    nsx-lcp-2.2.0.0.0.8680789-ubuntu-xenial_amd64.tar.gz  2018-06-05  119.36 MB  gz        
vmware-nsx-t-data-center          NSX-T-220      Product Binaries  2.2.0    nsx-lcp-2.2.0.0.0.8680789-rhel74_x86_64.tar.gz        2018-06-05  59.94 MB   gz        
vmware-nsx-t-data-center          NSX-T-110      Product Binaries  1.1.0    nsx-lcp-1.1.0.0.0.4788198-esx60.zip                   2017-02-02  16.58 MB   zip       
vmware-nsx-t-data-center          NSX-T-110      Product Binaries  1.1.0    nsx-lcp-1.1.0.0.0.4788198-esx65.zip                   2017-02-02  15.57 MB   zip       
vmware-nsx-t-data-center          NSX-T-110      Product Binaries  1.1.0    nsx-lcp-1.1.0.0.0.4788198-ubuntu-trusty_amd64.tar.gz  2017-02-02  38.46 MB   gz        
vmware-nsx-t-data-center          NSX-T-110      Product Binaries  1.1.0    nsx-lcp-1.1.0.0.0.4788198-ubuntu-xenial_amd64.tar.gz  2017-02-02  37.85 MB   gz        
vmware-nsx-t-data-center          NSX-T-110      Product Binaries  1.1.0    nsx-lcp-1.1.0.0.0.4788198-rhel71_x86_64.tar.gz        2017-02-02  46.35 MB   gz        
vmware-nsx-t-data-center          NSX-T-110      Product Binaries  1.1.0    nsx-lcp-1.1.0.0.0.4788198-rhel72_x86_64.tar.gz        2017-02-02  46.38 MB   gz        
vmware-nsx-cloud                  NSX-220-CLOUD  Product Binaries  2.2.0    nsx-lcp-2.2.0.0.0.8680789-esx65.zip                   2018-06-05  26.87 MB   zip       
vmware-nsx-cloud                  NSX-220-CLOUD  Product Binaries  2.2.0    nsx-lcp-2.2.0.0.0.8680789-esx67.zip                   2018-06-05  25.88 MB   zip       
vmware-nsx-cloud                  NSX-220-CLOUD  Product Binaries  2.2.0    nsx-lcp-2.2.0.0.0.8680789-ubuntu-xenial_amd64.tar.gz  2018-06-05  119.36 MB  gz        
vmware-nsx-cloud                  NSX-220-CLOUD  Product Binaries  2.2.0    nsx-lcp-2.2.0.0.0.8680789-rhel74_x86_64.tar.gz        2018-06-05  59.94 MB   gz        
[ 18/5435 ] entries - filter [ fileName:lcp ]
Terminal size: 282x74
```

#### vmw-cli find fileName:ovftool,version:4.3.0
```
$ vmw-cli find fileName:ovftool,version:4.3.0

Index [allGroups.json] found - local load...
solution     productGroup  productType      version  fileName                                        fileDate    fileSize  fileType  
-----------  ------------  ---------------  -------  ----------------------------------------------  ----------  --------  --------  
vmware-vsan  OVFTOOL430    Drivers & Tools  4.3.0    VMware-ovftool-4.3.0-7948156-win.i386.msi       2018-04-17  19.86 MB  msi       
vmware-vsan  OVFTOOL430    Drivers & Tools  4.3.0    VMware-ovftool-4.3.0-7948156-win.x86_64.msi     2018-04-17  23.80 MB  msi       
vmware-vsan  OVFTOOL430    Drivers & Tools  4.3.0    VMware-ovftool-4.3.0-7948156-lin.i386.bundle    2018-04-17  33.42 MB  bundle    
vmware-vsan  OVFTOOL430    Drivers & Tools  4.3.0    VMware-ovftool-4.3.0-7948156-lin.x86_64.bundle  2018-04-17  34.79 MB  bundle    
vmware-vsan  OVFTOOL430    Drivers & Tools  4.3.0    VMware-ovftool-4.3.0-7948156-mac.x64.dmg        2018-04-17  18.25 MB  dmg       
[ 5/5435 ] entries - filter [ fileName:ovftool,version:4.3.0 ]
Terminal size: 282x74
```

#### vmw-cli find fileName:ovftool.*x86_64.bundle,version:4.3.0
```
$ vmw-cli find fileName:ovftool.*x86_64.bundle,version:4.3.0

Index [allGroups.json] found - local load...
solution     productGroup  productType      version  fileName                                        fileDate    fileSize  fileType  
-----------  ------------  ---------------  -------  ----------------------------------------------  ----------  --------  --------  
vmware-vsan  OVFTOOL430    Drivers & Tools  4.3.0    VMware-ovftool-4.3.0-7948156-lin.x86_64.bundle  2018-04-17  34.79 MB  bundle    
[ 1/5435 ] entries - filter [ fileName:ovftool.*x86_64.bundle,version:4.3.0 ]
Terminal size: 282x74
```

#### vmw-cli get fileName:ovftool.*x86_64.bundle,version:4.3.0

```
$ vmw-cli get fileName:ovftool.*x86_64.bundle,version:4.3.0
Index [allGroups.json] found - local load...
file[/usr/lib/node_modules/vmw-cli/index.json.session] does not exist, writing...
Synching delicious cookies from [https://my.vmware.com]
Offering up afforementioned snacks as a sacrifice to [https://my.vmware.com/oam/server/auth_cred_submit]
Pulling landing index.json [https://my.vmware.com/group/vmware/downloads]
{
	"name": "VMware OVF Tool for Linux 64-bit",
	"fileName": "VMware-ovftool-4.3.0-7948156-lin.x86_64.bundle",
	"fileDate": "2018-04-17",
	"fileSize": "34.79 MB",
	"fileType": "bundle",
	"buildNum": "7948156",
	"descr": "Download VMware OVF Tool installer for Linux 64-bit ",
	"md5sum": "d0dd9006d720a26278b94591a4111457",
	"sha1sum": "63fb48e2643187a13a239376c3f25d587ab04468",
	"sha256sum": "d327c8c7ebaac7432a589b1207410889d00c1ffd3fe18fa751b14459644de980",
	"download": {
		"downloadGroupCode": "OVFTOOL430",
		"downloadFileId": "d0dd9006d720a26278b94591a4111457",
		"vmware": "downloadBinary",
		"baseStr": "",
		"hashKey": "19fdaa3446e1f36e1da6e47fa45be1e4",
		"tagId": "9610",
		"productId": "745",
		"uuId": "b138d672-596b-4eb9-84b0-233062c31acf"
	}
}
[VMware-ovftool-4.3.0-7948156-lin.x86_64.bundle] downloading... [=================================================>] 100% 0.0s 14393 KB/s 36.47/36.47 MB
MD5 MATCH: local[ d0dd9006d720a26278b94591a4111457 ] remote [ d0dd9006d720a26278b94591a4111457 ]
```

## License

MIT © [Andrew Obersnel](https://github.com/apnex)
