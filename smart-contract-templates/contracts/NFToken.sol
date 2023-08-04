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
    event Reserved(uint256 indexed start, uint256 indexed end);

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

    function reserveIds(uint256 toReserve) public {
        _tokenIds.increment();
        uint256 start = _tokenIds.current();

        for (uint256 i = 1; i < toReserve; i++) {
            _tokenIds.increment();
        }
        uint256 end = _tokenIds.current();

        emit Reserved(start, end);
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
