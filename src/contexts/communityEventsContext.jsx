import React, { createContext, useContext, useState, useEffect } from "react";
import CommunityEngagementFacetABI from "../artifacts/contracts/CommunityEngagementFacet.sol/CommunityEngagementFacet.json";
import { toast } from "react-toastify";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../services/client";
import { getContract, readContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import CONTRACT_ADDRESSES from "../constants/addresses";

const CommunityEngagementFacet_ABI = CommunityEngagementFacetABI.abi;
const DiamondAddress = CONTRACT_ADDRESSES.diamond;

const CommunityEventsContext = createContext();

export const useCommunityEvents = () => {
  return useContext(CommunityEventsContext);
};

export const CommunityEventsProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;

  // Format events data from contract response
  const formatEvents = (eventsData) => {
    return eventsData.map((event) => ({
      id: Number(event.id),
      name: event.name,
      creator: event.creator,
      startTime: Number(event.startTime) * 1000, // Convert to milliseconds
      endTime: Number(event.endTime) * 1000, // Convert to milliseconds
      maxParticipants: Number(event.maxParticipants),
      currentParticipants: Number(event.currentParticipants),
      isActive: event.isActive,
      isOnline: event.isOnline,
      location: event.location,
      additionalDetails: event.additionalDetails,
      //   status: getEventStatus(
      //     Number(event.startTime) * 1000,
      //     Number(event.endTime) * 1000
      //   ),
    }));
  };

  // Determine event status
  const getEventStatus = (startTime, endTime) => {
    const now = Date.now();
    if (now < startTime) return "upcoming";
    if (now > endTime) return "past";
    return "ongoing";
  };

  // Fetch all events from the contract
  const fetchEvents = async () => {
    if (!isConnected) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const contract = await getContract({
        address: DiamondAddress,
        abi: CommunityEngagementFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      // const allEvents = await contract.getAllCommunityEvents();
      const allEvents = await readContract({
        contract,
        method: "getAllCommunityEvents",
        params: [],
      });
      // console.log("All Events b4 formatting: ", allEvents);
      const formattedEvents = formatEvents(allEvents);
      // toast.success("Community events loaded successfully");
      setEvents(formattedEvents);
      // console.log("All Events after formatting: ", formattedEvents);
    } catch (err) {
      console.error("Error fetching community events:", err);
      setError("Failed to load events. Please try again later.");
      toast.error("Failed to load community events");
    } finally {
      setLoading(false);
    }
  };

  // Get events filtered by status
  const getEventsByStatus = (status) => {
    return events.filter((event) => event.status === status);
  };

  // Initial fetch when connected
  useEffect(() => {
    if (isConnected) {
      fetchEvents();
    }
  }, [isConnected, events]);

  const value = {
    events,
    loading,
    error,
    fetchEvents,
    upcomingEvents: getEventsByStatus("upcoming"),
    ongoingEvents: getEventsByStatus("ongoing"),
    pastEvents: getEventsByStatus("past"),
  };

  return (
    <CommunityEventsContext.Provider value={value}>
      {children}
    </CommunityEventsContext.Provider>
  );
};
