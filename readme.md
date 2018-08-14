# vmw-cli
`vmw-cli` is a CLI client used to login and interact with my.vmware.com.  
It provides an interface for programmatic query and download of VMware product binaries.  

#### Configure authentication for my.vmware.com
```
export VMWUSER='<username>'
export VMWPASS='<password>'
```

## Install
`vmw-cli` can be installed natively via NPM or consumed using a pre-built docker image.
Requested files via the `get` command  will be downloaded to current directory.

#### via NPM
Once installed, `vmw-cli` can be leveraged directly via the `vmw-cli` shell command
```
npm install vmw-cli --global
```

#### via Docker
Examples listed below would require this `docker run` command in front
```
docker run -t -e VMWUSER -e VMWPASS -v ${PWD}:/files apnex/vmw-cli
```

## Usage
#### vmw-cli list
The `list` command displays the current high-level `<solutions>` available on my.vmware.com.  
You will need to first generate an index of files under at least 1 solution before proceeding with other commands.  
```
$ vmw-cli list
vmware-workstation-pro
vmware-workstation-player
vmware-workspace
vmware-workspace-one
vmware-vsphere
vmware-vsphere-with-operations-management
vmware-vsphere-storage-appliance
vmware-vsphere-integrated-containers
vmware-vsphere-hypervisor-esxi
vmware-vsphere-data-protection-advanced
vmware-vsan
-- <output ommitted> --
vmware-photon-platform
vmware-nsx-t-data-center
vmware-nsx-sd-wan
vmware-nsx-data-center-for-vsphere
vmware-nsx-cloud
vmware-integrated-openstack
```

#### vmw-cli index <solution>
The `index` command creates an index of files available to you as `fileIndex.json`.  
You will need to use one of the `<solution>` entries available from the `list` command.  
The index intentionally creates duplicate entries for files, as a `product` may map to multiple `solutions`.  
You can issue the `index` command multiple times to generate a consolidated index of all files.  

**WARNING: Some solutions such as `vmware-vsphere` and `vmware-vsan` contain a large number of products, and could take 10-15 mins to index**
```
$ vmw-cli index vmware-nsx-t-data-center
Updating [fileIndex.json] for all permitted downloads in [vmware-nsx-t-data-center] ...
file[/state/index.json.session] does not exist, writing...
Synching delicious cookies from [https://my.vmware.com]
Offering up afforementioned snacks as a sacrifice to [https://my.vmware.com/oam/server/auth_cred_submit]
Pulling landing index.json [https://my.vmware.com/group/vmware/downloads]
Resolving files in solution [vmware-nsx-t-data-center]
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-220&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRLI-461-NSX&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRNI-380&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-PKS-221&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-PKS-220&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-PKS-214&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-PKS-213&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-PKS-212&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-PKS-2101&productId=673
-- <output ommitted> --
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRLI-430-OSS&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-110&productId=631
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRLI-430-NSX&productId=631
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-110-OPENSTACK&productId=631
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRLI-430-OSS&productId=631
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRLI-400-OSS&productId=631
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-110-OSS&productId=631
Merging [vmware-nsx-t-data-center] into [fileIndex.json] ...
timer: 19227.940ms
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
		"tagId": "9610",
		"productId": "745",
	}
}
[VMware-ovftool-4.3.0-7948156-lin.x86_64.bundle] downloading... [=================================================>] 100% 0.0s 14393 KB/s 36.47/36.47 MB
MD5 MATCH: local[ d0dd9006d720a26278b94591a4111457 ] remote [ d0dd9006d720a26278b94591a4111457 ]
```

## License

MIT © [Andrew Obersnel](https://github.com/apnex)
