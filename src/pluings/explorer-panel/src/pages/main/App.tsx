import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
} from "@mui/material";
import React from "react";

const asyncAPIDocument = {
  asyncapi: "3.0.0",
  info: {
    title: "Example AsyncAPI",
    version: "1.0.0",
    description: "An example of an AsyncAPI document with $ref support.",
    contact: {
      name: "API Support",
      email: "support@example.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: {
    production: {
      host: "api.example.com",
      protocol: "mqtt",
      description: "Production MQTT broker",
    },
  },
  channels: {
    userSignedUp: {
      address: "user/signedup",
      description: "Channel for user sign-up events.",
      messages: {
        userSignupMessage: {
          $ref: "#/components/messages/userSignupMessage",
        },
      },
    },
  },
  operations: {
    receiveUserSignup: {
      action: "receive",
      channel: { channelId: "userSignedUp" },
      messages: [
        {
          messageId: "userSignupMessage",
        },
      ],
      summary: "Receive user sign up events.",
    },
  },
  components: {
    messages: {
      userSignupMessage: {
        name: "UserSignup",
        title: "User Sign Up",
        summary: "Inform about new user sign ups.",
        contentType: "application/json",
        payload: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string", format: "email" },
          },
          required: ["id", "email"],
        },
      },
    },
  },
};

function resolveRef(ref: string, root: any): any {
  const path = ref.replace(/^#\//, "").split("/");
  return path.reduce((acc, part) => acc && acc[part], root);
}

function tryMockRequest(channel: string, payload: any) {
  alert(
    `Mock request sent to ${channel} with payload:\n\n${JSON.stringify(
      payload,
      null,
      2,
    )}`,
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="h4"
      sx={{
        mt: 6,
        mb: 2,
        color: "#8e24aa",
        borderBottom: "2px solid #ba68c8",
        pb: 1,
      }}
    >
      {children}
    </Typography>
  );
}

function AsyncAPIViewer() {
  const { info, servers, channels, operations } = asyncAPIDocument;

  return (
    <Box sx={{ maxWidth: "1000px", mx: "auto", p: 4 }}>
      <Card sx={{ border: "2px solid #8e24aa", backgroundColor: "#f3e5f5" }}>
        <CardContent>
          <Typography
            variant="h3"
            sx={{ color: "#6a1b9a", fontWeight: "bold", mb: 1 }}
          >
            {info.title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1, color: "#7b1fa2" }}>
            Version:
            {" "}
            {info.version}
          </Typography>
          {info.description && (
            <Typography sx={{ fontStyle: "italic", color: "#8e24aa", mb: 2 }}>
              {info.description}
            </Typography>
          )}
          {info.contact && (
            <Typography variant="body2" sx={{ color: "#1e88e5" }}>
              Contact:
              {" "}
              {info.contact.name}
              {" "}
              (
              {info.contact.email}
              )
            </Typography>
          )}
          {info.license && (
            <Typography variant="body2" sx={{ color: "#43a047" }}>
              License:
              {" "}
              <a href={info.license.url} style={{ color: "#43a047" }}>
                {info.license.name}
              </a>
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Servers */}
      <SectionTitle>Servers</SectionTitle>
      <Grid container spacing={2}>
        {Object.entries(servers).map(([key, server]) => (
          <Grid item xs={12} md={6} key={key}>
            <Card
              sx={{ border: "1px solid #1e88e5", backgroundColor: "#e3f2fd" }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: "#1565c0" }}>
                  {key}
                </Typography>
                <Typography variant="body2">
                  {server.protocol}
                  ://
                  {server.host}
                </Typography>
                <Typography variant="body2" sx={{ color: "#1976d2" }}>
                  {server.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Channels */}
      <SectionTitle>Channels</SectionTitle>
      {Object.entries(channels).map(([key, channel]) => (
        <Card
          key={key}
          sx={{
            my: 3,
            border: "1px solid #ec407a",
            backgroundColor: "#fce4ec",
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ color: "#ad1457" }}>
              {key}
            </Typography>
            <Typography variant="body2" sx={{ color: "#c2185b" }}>
              Address:
              {" "}
              {channel.address}
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: "italic", mb: 2 }}>
              {channel.description}
            </Typography>

            {Object.entries(channel.messages).map(([msgKey, msgDef]) => {
              const msg = msgDef.$ref
                ? resolveRef(msgDef.$ref, asyncAPIDocument)
                : msgDef;
              return (
                <Box key={msgKey} sx={{ mb: 2 }}>
                  <Chip
                    label={msg.name}
                    sx={{ mb: 1, backgroundColor: "#a5d6a7", color: "#1b5e20" }}
                  />
                  <Typography variant="body2" sx={{ color: "#388e3c" }}>
                    {msg.summary}
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      whiteSpace: "pre-wrap",
                      backgroundColor: "#e8f5e9",
                      borderRadius: 1,
                      p: 2,
                      border: "1px solid #81c784",
                      fontSize: "0.85rem",
                      overflowX: "auto",
                    }}
                  >
                    {JSON.stringify(msg.payload, null, 2)}
                  </Box>
                  <Button
                    variant="contained"
                    color="secondary"
                    sx={{ mt: 1 }}
                    onClick={() => tryMockRequest(channel.address, msg.payload)}
                  >
                    Try This Request
                  </Button>
                </Box>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Operations */}
      <SectionTitle>Operations</SectionTitle>
      <Grid container spacing={2}>
        {Object.entries(operations).map(([key, op]) => (
          <Grid item xs={12} md={6} key={key}>
            <Card
              sx={{ border: "1px solid #fbc02d", backgroundColor: "#fff9c4" }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: "#f57f17" }}>
                  {key}
                </Typography>
                <Typography variant="body2">
                  Action:
                  {op.action}
                </Typography>
                <Typography variant="body2">
                  Channel:
                  {" "}
                  {op.channel.channelId}
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                  {op.summary}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default AsyncAPIViewer;
