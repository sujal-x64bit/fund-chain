// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title FundChain — all-or-nothing crowdfunding
/// @notice A creator sets a goal and a deadline. People contribute test ETH.
///         If the goal is met by the deadline, the creator withdraws the money.
///         If not, every contributor can take their money back.
contract FundChain {
    struct Campaign {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 goal;
        uint256 deadline;
        uint256 totalRaised;
        bool withdrawn;
    }

    Campaign[] private campaigns;

    // How much each wallet contributed to each campaign (in wei).
    mapping(uint256 => mapping(address => uint256)) public contributions;

    event CampaignCreated(uint256 indexed id, address indexed creator, uint256 goal, uint256 deadline);
    event Contributed(uint256 indexed id, address indexed contributor, uint256 amount);
    event Withdrawn(uint256 indexed id, address indexed creator, uint256 amount);
    event Refunded(uint256 indexed id, address indexed contributor, uint256 amount);

    function createCampaign(
        string calldata title,
        string calldata description,
        uint256 goal,
        uint256 durationInMinutes
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(goal > 0, "Goal must be greater than 0");
        require(durationInMinutes > 0, "Duration must be at least 1 minute");

        uint256 id = campaigns.length;
        uint256 deadline = block.timestamp + (durationInMinutes * 1 minutes);

        campaigns.push(
            Campaign({
                id: id,
                creator: msg.sender,
                title: title,
                description: description,
                goal: goal,
                deadline: deadline,
                totalRaised: 0,
                withdrawn: false
            })
        );

        emit CampaignCreated(id, msg.sender, goal, deadline);
        return id;
    }

    function contribute(uint256 campaignId) external payable {
        require(campaignId < campaigns.length, "Campaign does not exist");
        Campaign storage c = campaigns[campaignId];

        require(block.timestamp < c.deadline, "Campaign has ended");
        require(msg.value > 0, "Contribution must be greater than 0");

        c.totalRaised += msg.value;
        contributions[campaignId][msg.sender] += msg.value;

        emit Contributed(campaignId, msg.sender, msg.value);
    }

    /// @notice Creator takes the pot after the deadline, only if the goal was met.
    function withdrawFunds(uint256 campaignId) external {
        require(campaignId < campaigns.length, "Campaign does not exist");
        Campaign storage c = campaigns[campaignId];

        require(msg.sender == c.creator, "Only the creator can withdraw");
        require(block.timestamp >= c.deadline, "Campaign is still running");
        require(c.totalRaised >= c.goal, "Goal was not met");
        require(!c.withdrawn, "Funds already withdrawn");

        // Update state before sending ETH (checks-effects-interactions).
        c.withdrawn = true;
        uint256 amount = c.totalRaised;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");

        emit Withdrawn(campaignId, msg.sender, amount);
    }

    /// @notice Contributor pulls their own refund if the goal was missed.
    function refund(uint256 campaignId) external {
        require(campaignId < campaigns.length, "Campaign does not exist");
        Campaign storage c = campaigns[campaignId];

        require(block.timestamp >= c.deadline, "Campaign is still running");
        require(c.totalRaised < c.goal, "Goal was met, no refunds");

        uint256 amount = contributions[campaignId][msg.sender];
        require(amount > 0, "Nothing to refund");

        contributions[campaignId][msg.sender] = 0;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");

        emit Refunded(campaignId, msg.sender, amount);
    }

    function getAllCampaigns() external view returns (Campaign[] memory) {
        return campaigns;
    }

    function getCampaignCount() external view returns (uint256) {
        return campaigns.length;
    }
}
