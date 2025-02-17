"use strict";

var base = require("./index.cjs");
var client = require("@apollo/client");

exports.ApolloNextAppProvider = base.ApolloNextAppProvider;
exports.DebounceMultipartResponsesLink = base.DebounceMultipartResponsesLink;
exports.NextSSRApolloClient = base.ApolloClient;
exports.NextSSRInMemoryCache = base.InMemoryCache;
exports.RemoveMultipartDirectivesLink = base.RemoveMultipartDirectivesLink;
exports.SSRMultipartLink = base.SSRMultipartLink;
exports.resetNextSSRApolloSingletons = base.resetApolloClientSingletons;
exports.useBackgroundQuery = client.useBackgroundQuery;
exports.useFragment = client.useFragment;
exports.useQuery = client.useQuery;
exports.useReadQuery = client.useReadQuery;
exports.useSuspenseQuery = client.useSuspenseQuery;
