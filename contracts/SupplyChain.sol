// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

contract SupplyChain {

  enum supplyProcess{ 
    InProgress,
    Drawing,
    Designing,
    Cutting,
    Ready 
    }

  struct product{
      string name;  
      string category;
      supplyProcess proc;
  }

  mapping(uint=>product) public productInfo;
  uint public index = 0;

  function setProduct(string memory name,string memory category) public payable {
    productInfo[index].name = name;
    productInfo[index].category = category;
    productInfo[index].proc = supplyProcess.InProgress;
    index++;
  }

  function addProcess(uint productId,string memory trackInfo) public payable {
    if(keccak256(abi.encodePacked(trackInfo)) == keccak256(abi.encodePacked("InProgress")) || 
    keccak256(abi.encodePacked(trackInfo)) == keccak256(abi.encodePacked("In Progress"))) {
      productInfo[productId].proc = supplyProcess.InProgress;
    }
    else if(keccak256(abi.encodePacked(trackInfo)) == keccak256(abi.encodePacked("Drawing"))) {
      productInfo[productId].proc = supplyProcess.Drawing;
    }
    else if(keccak256(abi.encodePacked(trackInfo)) == keccak256(abi.encodePacked("Designing"))) { 
           productInfo[productId].proc = supplyProcess.Designing;
} 
    else if(keccak256(abi.encodePacked(trackInfo)) == keccak256(abi.encodePacked("Cutting"))) {
            productInfo[productId].proc = supplyProcess.Cutting;
}
    else if(keccak256(abi.encodePacked(trackInfo)) == keccak256(abi.encodePacked("Ready"))) {
            productInfo[productId].proc = supplyProcess.Ready;
}
  }

  function getProduct(uint id) public view returns (product memory) {
    return(productInfo[id]);
  }
}