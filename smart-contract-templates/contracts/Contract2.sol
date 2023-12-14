// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./NFToken.sol";
import "./EnumerableMapAddressToUint.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./Contract.sol";

contract Contract2 {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    // Contract unique identifier
    bytes private _identifier;
    // Contract parties address
    EnumerableSet.AddressSet _parties;
    // Contract deontic expression NFtoken
    NFToken public _nfToken;
    // Contract deontic expressions token id
    EnumerableSet.UintSet _deonticExpressions;

    // Contract objects token id
    EnumerableSet.UintSet _objects;

    // Contract content URI (from Turtle)
    string public _contentUri;
    // Contract content HASH
    bytes public _contentHash;

    event IPRPaymentDone(
        address sender,
        string onBehalfOf,
        address beneficiary,
        uint256 amount
    );

    constructor(
        bytes memory identifier,
        address[] memory parties,
        NFToken nfToken,
        uint256[] memory deonticExpressionsIds,
        uint256[] memory objects,
        string memory contentUri,
        bytes memory contentHash
    ) {
        _identifier = identifier;

        for (uint256 i = 0; i < parties.length; i++) {
            _parties.add(parties[i]);
        }
        _nfToken = nfToken;
        for (uint256 i = 0; i < deonticExpressionsIds.length; i++) {
            _deonticExpressions.add(deonticExpressionsIds[i]);
        }
        for (uint256 i = 0; i < objects.length; i++) {
            _objects.add(objects[i]);
        }
        _contentUri = contentUri;
        _contentHash = contentHash;
    }

    function payTo(
        address previousContract,
        address sender,
        address beneficiary,
        uint256 amount,
        string memory onBehalfOf
    ) public {
        Contract previousC = Contract(previousContract);

        previousC.payTo(sender, beneficiary, amount, "");

        emit IPRPaymentDone(sender, onBehalfOf, beneficiary, amount);
    }

    function payTo(
        address previousContract,
        address sender,
        address beneficiary,
        uint256 amount
    ) public {
        return payTo(previousContract, sender, beneficiary, amount, "");
    }

    function getParties() public view returns (address[] memory) {
        address[] memory parties = new address[](_parties.length());
        for (uint256 i = 0; i < _parties.length(); i++) {
            parties[i] = _parties.at(i);
        }

        return parties;
    }

    function getDeonticExpressions() public view returns (uint256[] memory) {
        uint256[] memory deontics = new uint256[](_deonticExpressions.length());
        for (uint256 i = 0; i < _deonticExpressions.length(); i++) {
            deontics[i] = _deonticExpressions.at(i);
        }

        return deontics;
    }

    function getObjects() public view returns (uint256[] memory) {
        uint256[] memory objects = new uint256[](_objects.length());
        for (uint256 i = 0; i < _objects.length(); i++) {
            objects[i] = _objects.at(i);
        }

        return objects;
    }
}
