// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFToken is ERC721URIStorage {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    /**
     * @dev Emitted when `tokenId` token is reserved.
     */
    event Reserved(uint256 indexed tokenId);

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {}

    function newToken(
        address receiver,
        string memory tokenURI
    ) public returns (uint256) {
        _tokenIds.increment();

        uint256 newTokenId = _tokenIds.current();
        _mint(receiver, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        return newTokenId;
    }

    function reserveId() public returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        emit Reserved(newTokenId);

        return newTokenId;
    }

    function newTokenFromReserved(
        address receiver,
        string memory tokenURI,
        uint256 reserved
    ) public returns (uint256) {
        _mint(receiver, reserved);
        _setTokenURI(reserved, tokenURI);

        return reserved;
    }
}
